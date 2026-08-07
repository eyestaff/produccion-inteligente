import { expect, test, describe, beforeAll } from 'vitest';
import { initializeSchema } from '../worker/db/repositories';
import { router } from '../worker/router';
const fakeDb: any = {
  prepare: () => ({
    bind: () => ({
      first: async () => null,
      all: async () => [],
      run: async () => {},
    }),
    first: async () => null,
    all: async () => [],
    run: async () => {},
  }),
};

// Simplified integration test for Sprint 5 Catalog Routes
describe('Catalog REST API (Multi-tenant)', () => {
  let env: any;

  beforeAll(async () => {
    env = {
      DB: fakeDb,
      JWT_SECRET: 'test-secret',
    };
    await initializeSchema(fakeDb);
    // Insert mock sessions/users would happen here, but since auth is bypassed or tested via mocks in router
    // We will simulate the authContext injection by just testing the services directly if router auth is hard to mock,
    // Or we assume the router test works if we can pass a valid auth header.
    // For now we just test that the endpoints exist and return 401 without auth.
  });

  test('GET /api/stores returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/stores');
    const res = await router(req, env);
    expect(res.status).toBe(401);
  });

  test('GET /api/business-lines returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/business-lines');
    const res = await router(req, env);
    expect(res.status).toBe(401);
  });

  test('GET /api/products returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/products');
    const res = await router(req, env);
    expect(res.status).toBe(401);
  });
});
