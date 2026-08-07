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

export async function initializeDb(db: D1Database) {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value TEXT, created_at TEXT);
     CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
     CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, email TEXT UNIQUE, password_hash TEXT, password_salt TEXT, role TEXT DEFAULT 'user', status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(company_id) REFERENCES companies(id));
     CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, token TEXT UNIQUE, expires_at INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));`,
  );
}
