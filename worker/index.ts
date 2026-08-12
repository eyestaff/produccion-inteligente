import { router } from './router';

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  ASSETS_FETCH?: Fetcher;
  AI?: any;
  PROJECT_NAME: string;
  APP_URL: string;
  BREVO_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router(request, env);
  },
};
