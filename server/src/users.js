import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { config } from './config.js';

const usersPath = join(config.dataDir, 'users.json');

const fileExists = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

export const normalizeEmail = (email) => email.trim().toLowerCase();

const readUsersFile = async () => {
  const raw = await fs.readFile(usersPath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid users store format.');
  }
  return parsed;
};

const writeUsersFile = async (users) => {
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
};

export const ensureUsersFile = async () => {
  await fs.mkdir(config.dataDir, { recursive: true });
  if (!(await fileExists(usersPath))) {
    await writeUsersFile([]);
  }
};

export const readUsers = async () => {
  if (!(await fileExists(usersPath))) {
    return [];
  }
  return readUsersFile();
};

export const countUsers = async () => {
  const users = await readUsers();
  return users.length;
};

export const findUserByEmail = async (email) => {
  const target = normalizeEmail(email);
  const users = await readUsers();
  return users.find((user) => user.email === target) || null;
};

export const createUser = async ({ email, passwordHash }) => {
  const normalizedEmail = normalizeEmail(email);
  const users = await readUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    return null;
  }

  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await writeUsersFile(users);
  return user;
};
