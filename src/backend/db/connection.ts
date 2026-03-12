import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;
let sqliteDb: Database.Database | undefined;

export function initDb() {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  // In packaged app, native modules live in resources/node_modules/
  // In dev, standard require from project node_modules
  const Database = app.isPackaged
    ? require(path.join(process.resourcesPath, 'node_modules', 'better-sqlite3'))
    : require('better-sqlite3');

  const dbPath = path.join(dataDir, 'matrix.db');
  const database = new Database(dbPath);
  sqliteDb = database;

  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

  db = drizzle(database, { schema });
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'data', 'matrix.db');
}

export function closeDb() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = undefined;
    db = undefined;
  }
}
