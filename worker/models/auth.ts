import type { UserResponse } from './users';

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: UserResponse;
  error?: string;
}

import type { RequestContext } from './context';

export interface AuthContext extends RequestContext {
  user: UserResponse;
  token: string;
}
