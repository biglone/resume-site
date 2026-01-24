import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { findUserByEmail, normalizeEmail } from './users.js';

export const signToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: '12h' });

export const hashPassword = (password) => bcrypt.hash(password, 10);

export const verifyCredentials = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);
  if (user) {
    return bcrypt.compare(password, user.passwordHash);
  }

  if (normalizedEmail !== normalizeEmail(config.adminEmail)) {
    return false;
  }

  if (config.adminPasswordHash) {
    return bcrypt.compare(password, config.adminPasswordHash);
  }

  return password === config.adminPassword;
};

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
