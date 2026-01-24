import { ensureDataFiles } from '../src/storage.js';

await ensureDataFiles();
console.log('Resume data initialized.');
