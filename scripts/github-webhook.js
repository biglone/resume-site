import http from 'http';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const secret = process.env.WEBHOOK_SECRET || '';
const port = Number(process.env.WEBHOOK_PORT || 18600);
const repoPath = process.env.REPO_PATH || process.cwd();
const deployScript = process.env.DEPLOY_SCRIPT || join(repoPath, 'scripts', 'deploy.sh');
const allowedRef = process.env.WEBHOOK_REF || 'refs/heads/main';
const allowedRepo = process.env.WEBHOOK_REPO || '';
const logDir = process.env.WEBHOOK_LOG_DIR || join(repoPath, 'logs');
const logFile = join(logDir, 'deploy-webhook.log');

let deployRunning = false;

const respondJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const verifySignature = (body, signatureHeader) => {
  if (!secret || !signatureHeader) {
    return false;
  }
  const signature = signatureHeader.replace('sha256=', '');
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (signature.length !== digest.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

const runDeploy = async () => {
  await mkdir(logDir, { recursive: true });
  const stream = createWriteStream(logFile, { flags: 'a' });
  stream.write(`\n[${new Date().toISOString()}] Deploy triggered\n`);

  const child = spawn('bash', [deployScript], {
    cwd: repoPath,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.pipe(stream);
  child.stderr.pipe(stream);

  child.on('close', (code) => {
    stream.write(`[${new Date().toISOString()}] Deploy finished with code ${code}\n`);
    stream.end();
    deployRunning = false;
  });
};

if (!secret) {
  console.error('WEBHOOK_SECRET is required.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    respondJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    const body = Buffer.concat(chunks);
    const signatureHeader = req.headers['x-hub-signature-256'] || '';

    if (!verifySignature(body, signatureHeader)) {
      respondJson(res, 401, { error: 'Invalid signature' });
      return;
    }

    let payload = null;
    try {
      payload = JSON.parse(body.toString('utf-8'));
    } catch {
      respondJson(res, 400, { error: 'Invalid JSON payload' });
      return;
    }

    const event = req.headers['x-github-event'];
    if (event === 'ping') {
      respondJson(res, 200, { message: 'pong' });
      return;
    }

    if (event !== 'push') {
      respondJson(res, 202, { message: 'Ignored event' });
      return;
    }

    if (allowedRepo && payload?.repository?.full_name !== allowedRepo) {
      respondJson(res, 202, { message: 'Ignored repository' });
      return;
    }

    if (payload?.ref !== allowedRef) {
      respondJson(res, 202, { message: 'Ignored ref' });
      return;
    }

    if (deployRunning) {
      respondJson(res, 409, { message: 'Deploy already running' });
      return;
    }

    deployRunning = true;
    runDeploy().catch((error) => {
      deployRunning = false;
      console.error('Deploy failed to start:', error);
    });
    respondJson(res, 202, { message: 'Deploy started' });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`GitHub webhook listening on http://0.0.0.0:${port}`);
});
