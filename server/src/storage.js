import { promises as fs } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { config } from './config.js';
import { resumeSchema } from './schema/resumeSchema.js';

const draftPath = join(config.dataDir, 'draft.json');
const publishedPath = join(config.dataDir, 'published.json');
const draftHistoryDir = join(config.dataDir, 'draft-history');
const historyFilePattern = /^[A-Za-z0-9-]+\.json$/;

const fileExists = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const nowIso = () => new Date().toISOString();

const createEmptyResume = () => ({
  profile: {
    name: '',
    title: '',
    avatar: '',
    bio: '',
    location: '',
    email: '',
    social: {}
  },
  experience: [],
  projects: [],
  skills: [],
  education: [],
  site: {
    title: 'My Resume',
    description: '',
    theme: 'auto',
    language: 'zh-CN'
  }
});

const loadSeedResume = async () => {
  try {
    const seed = await fs.readFile(config.seedResumePath, 'utf-8');
    const parsed = parse(seed);
    const result = resumeSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Seed resume validation failed: ${result.error.message}`);
    }
    return result.data;
  } catch (error) {
    return createEmptyResume();
  }
};

export const ensureDataFiles = async () => {
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.mkdir(draftHistoryDir, { recursive: true });

  if (!(await fileExists(draftPath))) {
    const resume = await loadSeedResume();
    const payload = { updatedAt: nowIso(), resume };
    await fs.writeFile(draftPath, JSON.stringify(payload, null, 2));
  }

  if (!(await fileExists(publishedPath)) && config.publishOnInit) {
    const draft = await readDraft();
    await writePublished(draft.resume, nowIso());
  }
};

const readJson = async (path) => {
  const raw = await fs.readFile(path, 'utf-8');
  return JSON.parse(raw);
};

const writeJson = async (path, data) => {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
};

const resolveHistoryPath = (id) => {
  if (!id || !historyFilePattern.test(id)) {
    return null;
  }
  return join(draftHistoryDir, id);
};

const safeTimestamp = (value) => value.replace(/[:.]/g, '-');

const writeDraftHistory = async (payload) => {
  const nonce = Math.random().toString(36).slice(2, 8);
  const fileName = `${safeTimestamp(payload.updatedAt)}-${nonce}.json`;
  const filePath = join(draftHistoryDir, fileName);
  await writeJson(filePath, payload);
};

export const readDraft = async () => {
  if (!(await fileExists(draftPath))) {
    return null;
  }
  return readJson(draftPath);
};

export const listDraftHistory = async (limit = 50) => {
  await fs.mkdir(draftHistoryDir, { recursive: true });
  const entries = await fs.readdir(draftHistoryDir);
  const items = [];

  for (const entry of entries) {
    if (!historyFilePattern.test(entry)) {
      continue;
    }
    const filePath = join(draftHistoryDir, entry);
    const payload = await readJson(filePath).catch(() => null);
    if (!payload) {
      continue;
    }
    items.push({
      id: entry,
      updatedAt: payload.updatedAt || '',
      profile: {
        name: payload.resume?.profile?.name || '',
        title: payload.resume?.profile?.title || ''
      }
    });
  }

  items.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  const total = items.length;
  const capped = Number.isFinite(limit) ? items.slice(0, limit) : items;
  return { total, items: capped };
};

export const readDraftHistory = async (id) => {
  const filePath = resolveHistoryPath(id);
  if (!filePath || !(await fileExists(filePath))) {
    return null;
  }
  return readJson(filePath);
};

export const writeDraft = async (resume) => {
  const payload = { updatedAt: nowIso(), resume };
  await writeJson(draftPath, payload);
  try {
    await writeDraftHistory(payload);
  } catch (error) {
    console.warn('Failed to write draft history:', error);
  }
  return payload;
};

export const readPublished = async () => {
  if (!(await fileExists(publishedPath))) {
    return null;
  }
  return readJson(publishedPath);
};

export const writePublished = async (resume, publishedAt = nowIso()) => {
  const payload = { publishedAt, resume };
  await writeJson(publishedPath, payload);
  return payload;
};

export const restoreDraftFromHistory = async (id) => {
  const payload = await readDraftHistory(id);
  if (!payload) {
    return null;
  }
  return writeDraft(payload.resume);
};
