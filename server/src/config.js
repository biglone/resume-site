import dotenv from 'dotenv';
import { resolve } from 'path';
import { repoRoot, serverRoot } from './paths.js';

dotenv.config();

const parseOrigins = (value) => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

export const config = {
  port: Number(process.env.PORT || 4000),
  appVersion: process.env.APP_VERSION || 'dev',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  allowRegistration: parseBoolean(process.env.ALLOW_REGISTRATION, false),
  dataDir: process.env.DATA_DIR
    ? resolve(process.env.DATA_DIR)
    : resolve(serverRoot, 'data'),
  opsVersionPath: process.env.OPS_VERSION_PATH
    ? resolve(process.env.OPS_VERSION_PATH)
    : '/app/ops-version',
  seedResumePath: process.env.SEED_RESUME_PATH
    ? resolve(process.env.SEED_RESUME_PATH)
    : resolve(repoRoot, 'src', 'config', 'resume.yaml'),
  publishOnInit: process.env.SEED_PUBLISH_ON_INIT !== 'false',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN)
};
