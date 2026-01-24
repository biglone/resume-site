import { promises as fs } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { config } from './config.js';
import { resumeSchema } from './schema/resumeSchema.js';

const draftPath = join(config.dataDir, 'draft.json');
const publishedPath = join(config.dataDir, 'published.json');

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

export const readDraft = async () => {
  if (!(await fileExists(draftPath))) {
    return null;
  }
  return readJson(draftPath);
};

export const writeDraft = async (resume) => {
  const payload = { updatedAt: nowIso(), resume };
  await writeJson(draftPath, payload);
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
