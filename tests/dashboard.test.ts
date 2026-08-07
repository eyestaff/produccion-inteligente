import { describe, expect, it } from 'vitest';
import worker, { type Env } from '../worker/index';

describe('dashboard API', () => {
  it('returns the simulated dashboard payload', async () => {
    const response = await worker.fetch(new Request('http://example.com/api/dashboard'), {
      DB: {} as D1Database,
      ASSETS: {} as R2Bucket,
      PROJECT_NAME: 'Test',
    } as Env);

    expect(response.status).toBe(401);
    const payload = (await response.json()) as any;
    expect(payload.error).toBe('No autorizado');
  });
});
