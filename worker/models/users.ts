export interface User {
  id: number;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: string;
  status: string;
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
}
