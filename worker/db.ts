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

export async function getRecords(
  db: Env['DB'],
  query?: string,
  page = 1,
  limit = 10,
): Promise<PaginatedRecords> {
  const offset = (page - 1) * limit;
  const likeQuery = query ? `%${query}%` : undefined;
  const baseQuery = query ? 'FROM records WHERE name LIKE ? OR value LIKE ?' : 'FROM records';

  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const countStmt = db.prepare(countQuery);
  if (query) {
    countStmt.bind(likeQuery, likeQuery);
  }
  const countResult = await countStmt.first<Record<string, unknown>>();
  const total = Number(countResult?.total ?? 0);

  const recordsQuery = `
    SELECT id, name, value, created_at
    ${baseQuery}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const recordsStmt = db.prepare(recordsQuery);
  if (query) {
    recordsStmt.bind(likeQuery, likeQuery, limit, offset);
  } else {
    recordsStmt.bind(limit, offset);
  }
  const recordsResult = await recordsStmt.all<RecordResult>();

  return {
    records: recordsResult.results,
    total,
  };
}

export async function getRecordById(db: Env['DB'], id: number): Promise<RecordResult | null> {
  const record = await db
    .prepare('SELECT id, name, value, created_at FROM records WHERE id = ?')
    .bind(id)
    .first<RecordResult>();
  return record ?? null;
}

export async function addRecord(db: Env['DB'], name: string, value: string): Promise<void> {
  await db
    .prepare("INSERT INTO records (name, value, created_at) VALUES (?, ?, datetime('now'))")
    .bind(name, value)
    .run();
}

export async function updateRecord(
  db: Env['DB'],
  id: number,
  name: string,
  value: string,
): Promise<void> {
  await db
    .prepare('UPDATE records SET name = ?, value = ? WHERE id = ?')
    .bind(name, value, id)
    .run();
}

export async function deleteRecord(db: Env['DB'], id: number): Promise<void> {
  await db.prepare('DELETE FROM records WHERE id = ?').bind(id).run();
}
