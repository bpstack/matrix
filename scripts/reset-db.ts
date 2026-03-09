import fs from 'fs';
import path from 'path';

const userDataPath = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'Matrix')
  : path.join(process.cwd(), '.matrix');

const dataDir = path.join(userDataPath, 'data');
const dbPath = path.join(dataDir, 'matrix.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Deleted database: ${dbPath}`);
} else {
  console.log('Database file not found at:', dbPath);
}

const walPath = dbPath + '-wal';
const shmPath = dbPath + '-shm';
if (fs.existsSync(walPath)) {
  fs.unlinkSync(walPath);
  console.log(`Deleted WAL: ${walPath}`);
}
if (fs.existsSync(shmPath)) {
  fs.unlinkSync(shmPath);
  console.log(`Deleted SHM: ${shmPath}`);
}

console.log('Database reset complete');
