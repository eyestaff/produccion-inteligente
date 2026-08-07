import { router } from './router';

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  PROJECT_NAME: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router(request, env);
  },
};
