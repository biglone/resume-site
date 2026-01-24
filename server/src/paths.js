import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const serverRoot = resolve(__dirname, '..');
export const repoRoot = resolve(serverRoot, '..');
