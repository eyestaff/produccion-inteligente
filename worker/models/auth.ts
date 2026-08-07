import type { UserResponse } from './users';

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: UserResponse;
  error?: string;
}

export interface AuthContext {
  user: UserResponse;
  token: string;
  companyId: number;
}
