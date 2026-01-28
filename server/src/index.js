import express from 'express';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import cors from 'cors';
import { config } from './config.js';
import {
  ensureDataFiles,
  listDraftHistory,
  readDraft,
  readDraftHistory,
  readPublished,
  restoreDraftFromHistory,
  writeDraft,
  writePublished
} from './storage.js';
import { resumeSchema } from './schema/resumeSchema.js';
import { hashPassword, requireAuth, signToken, verifyCredentials } from './auth.js';
import { countUsers, createUser, ensureUsersFile, findUserByEmail } from './users.js';

const app = express();
const uploadsDir = join(config.dataDir, 'uploads');
const uploadMimeMap = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};
const maxUploadBytes = 2 * 1024 * 1024;

app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(uploadsDir));

app.use(
  cors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const readOpsVersion = async () => {
  if (!config.opsVersionPath) {
    return null;
  }
  try {
    const value = await fs.readFile(config.opsVersionPath, 'utf-8');
    return value.trim() || null;
  } catch {
    return null;
  }
};

app.get('/api/meta', async (req, res) => {
  const opsVersion = await readOpsVersion();
  res.json({
    appVersion: config.appVersion,
    opsVersion
  });
});

const parseDataUrl = (dataUrl) => {
  if (typeof dataUrl !== 'string') {
    return null;
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  const mime = match[1].toLowerCase();
  let buffer = null;
  try {
    buffer = Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
  return { mime, buffer };
};

app.post('/api/uploads/avatar', requireAuth, async (req, res) => {
  const { dataUrl } = req.body || {};
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid image payload' });
  }

  const ext = uploadMimeMap[parsed.mime];
  if (!ext) {
    return res.status(400).json({ error: 'Unsupported image type' });
  }

  if (parsed.buffer.length > maxUploadBytes) {
    return res.status(413).json({ error: 'Image exceeds 2MB limit' });
  }

  const fileName = `avatar-${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
  const filePath = join(uploadsDir, fileName);
  await fs.writeFile(filePath, parsed.buffer);
  return res.json({ path: `/uploads/${fileName}` });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const ok = await verifyCredentials(email, password);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ email });
  return res.json({ token });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const userCount = await countUsers();
  if (userCount > 0 && !config.allowRegistration) {
    return res.status(403).json({ error: 'Registration is closed' });
  }

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email: normalizedEmail, passwordHash });
  if (!user) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const token = signToken({ email: user.email });
  return res.json({ token });
});

app.get('/api/resume/draft', requireAuth, async (req, res) => {
  const draft = await readDraft();
  if (!draft) {
    return res.status(404).json({ error: 'Draft not found' });
  }
  return res.json(draft);
});

app.put('/api/resume/draft', requireAuth, async (req, res) => {
  const parseResult = resumeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid resume payload',
      details: parseResult.error.errors
    });
  }

  const updated = await writeDraft(parseResult.data);
  return res.json(updated);
});

app.get('/api/resume/draft/history', requireAuth, async (req, res) => {
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 50;
  const payload = await listDraftHistory(limit);
  return res.json(payload);
});

app.get('/api/resume/draft/history/:id', requireAuth, async (req, res) => {
  const payload = await readDraftHistory(req.params.id);
  if (!payload) {
    return res.status(404).json({ error: 'Draft history not found' });
  }
  return res.json({ id: req.params.id, ...payload });
});

app.post('/api/resume/draft/history/:id/restore', requireAuth, async (req, res) => {
  const restored = await restoreDraftFromHistory(req.params.id);
  if (!restored) {
    return res.status(404).json({ error: 'Draft history not found' });
  }
  return res.json(restored);
});

app.post('/api/resume/publish', requireAuth, async (req, res) => {
  const draft = await readDraft();
  if (!draft) {
    return res.status(404).json({ error: 'Draft not found' });
  }

  const published = await writePublished(draft.resume);
  return res.json(published);
});

app.get('/api/resume/published', async (req, res) => {
  const published = await readPublished();
  if (!published) {
    return res.status(404).json({ error: 'Published resume not found' });
  }
  return res.json(published);
});

await ensureDataFiles();
await ensureUsersFile();

app.listen(config.port, () => {
  console.log(`Resume API listening on http://localhost:${config.port}`);
});
