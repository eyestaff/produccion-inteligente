export interface User {
  id: number;
  companyId: number;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: string;
  status: string;
  mustChangePassword: number; // 0 | 1 (SQLite integer)
  createdAt: string;
}

export interface Session {
  id: number;
  userId: number;
  token: string;
  expiresAt: number;
  createdAt: string;
}

export interface UserResponse {
  id: number;
  email: string;
  role: string;
  status: string;
  mustChangePassword: boolean;
}
