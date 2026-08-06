import { describe, expect, it } from 'vitest';
import worker, { type Env } from '../worker/index';

describe('dashboard API', () => {
  it('returns the simulated dashboard payload', async () => {
    const response = await worker.fetch(new Request('http://example.com/api/dashboard'), {
      DB: {} as D1Database,
      ASSETS: {} as R2Bucket,
      PROJECT_NAME: 'Test',
    } as Env);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      productionToday: 0,
      wastePercent: 0,
      inventory: 0,
      forecast: 0,
      weeklyProduction: [120, 135, 128, 142, 150, 161, 147],
      stores: [
        { name: 'Tienda 1', status: 'ok' },
        { name: 'Tienda 2', status: 'ok' },
      ],
    });
  });
});
