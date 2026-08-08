import type { Env } from '../index';
import type { User, Session } from '../models/users';

export async function findUserByEmail(db: Env['DB'], email: string): Promise<User | null> {
  const user = await db
    .prepare(
      'SELECT id, company_id as companyId, email, password_hash as passwordHash, password_salt as passwordSalt, role, status, must_change_password as mustChangePassword, created_at as createdAt FROM users WHERE email = ?',
    )
    .bind(email)
    .first<User>();
  return user ?? null;
}

export async function findUserById(db: Env['DB'], id: number): Promise<User | null> {
  const user = await db
    .prepare(
      'SELECT id, company_id as companyId, email, password_hash as passwordHash, password_salt as passwordSalt, role, status, must_change_password as mustChangePassword, created_at as createdAt FROM users WHERE id = ?',
    )
    .bind(id)
    .first<User>();
  return user ?? null;
}

export async function createUser(
  db: Env['DB'],
  companyId: number,
  email: string,
  passwordHash: string,
  passwordSalt: string,
  role = 'user',
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO users (company_id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(companyId, email, passwordHash, passwordSalt, role)
    .run();
}

export async function createSession(
  db: Env['DB'],
  userId: number,
  token: string,
  expiresAt: number,
): Promise<void> {
  await db
    .prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
    .bind(userId, token, expiresAt)
    .run();
}

export async function findSessionByToken(db: Env['DB'], token: string): Promise<Session | null> {
  const session = await db
    .prepare(
      'SELECT id, user_id as userId, token, expires_at as expiresAt, created_at as createdAt FROM sessions WHERE token = ?',
    )
    .bind(token)
    .first<Session>();
  return session ?? null;
}

export async function deleteSession(db: Env['DB'], token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

/**
 * Updates a user's password and clears the must_change_password flag.
 * Uses the same PBKDF2 hashing as the rest of the auth system.
 */
export async function updateUserPassword(
  db: Env['DB'],
  userId: number,
  newPasswordHash: string,
  newPasswordSalt: string,
): Promise<void> {
  await db
    .prepare(
      'UPDATE users SET password_hash = ?, password_salt = ?, must_change_password = 0 WHERE id = ?',
    )
    .bind(newPasswordHash, newPasswordSalt, userId)
    .run();
}
