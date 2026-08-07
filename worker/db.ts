import type { Env } from './index';

export interface RecordResult {
  id: number;
  name: string;
  value: string;
  created_at: string;
}

export interface PaginatedRecords {
  records: RecordResult[];
  total: number;
}

export async function initializeDb(db: Env['DB']): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      value TEXT,
      created_at TEXT
    )
  `);
}
