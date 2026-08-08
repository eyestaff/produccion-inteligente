import type { Env } from '../index';
import type { UserResponse } from '../models/users';
import type { LoginResponse } from '../models/auth';
import { findUserByEmail, createSession, deleteSession } from '../repositories/users.repository';

// WebCrypto helper for PBKDF2 hashing
export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256,
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function loginUser(
  db: Env['DB'],
  email: string,
  passwordPlain: string,
): Promise<LoginResponse> {
  const user = await findUserByEmail(db, email);
  if (!user) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  if (user.status !== 'active') {
    return { success: false, error: 'Usuario inactivo' };
  }

  const hashToVerify = await hashPassword(passwordPlain, user.passwordSalt);
  if (hashToVerify !== user.passwordHash) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  const token = generateToken();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

  await createSession(db, user.id, token, expiresAt);

  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword === 1,
  };

  return {
    success: true,
    token,
    user: userResponse,
  };
}

export async function logoutUser(db: Env['DB'], token: string): Promise<void> {
  await deleteSession(db, token);
}
