import { describe, expect, it } from 'vitest';
import { listAssets, uploadAsset, deleteAsset } from '../src/storage';

const fakeBucket = {
  list: async () => ({ objects: [{ key: 'documento.txt' }] }),
  put: async () => ({ success: true }),
  get: async () => ({ body: 'test', httpMetadata: { contentType: 'text/plain' } }),
  delete: async () => ({ success: true }),
};

describe('storage helpers', () => {
  it('returns paginated assets', async () => {
    const result = await listAssets(fakeBucket as any, 'documento', 1, 10);
    expect(result.total).toBe(1);
    expect(result.assets).toEqual(['documento.txt']);
  });

  it('uploads an asset', async () => {
    await expect(uploadAsset(fakeBucket as any, 'documento.txt', 'test')).resolves.toBeUndefined();
  });

  it('deletes an asset', async () => {
    await expect(deleteAsset(fakeBucket as any, 'documento.txt')).resolves.toBeUndefined();
  });
});
