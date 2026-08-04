import type { Env } from './index';

export interface PaginatedAssets {
  assets: string[];
  total: number;
}

export async function uploadAsset(
  bucket: Env['ASSETS'],
  key: string,
  body: BodyInit,
): Promise<void> {
  await bucket.put(key, body);
}

export async function getAsset(bucket: Env['ASSETS'], key: string): Promise<Response | null> {
  const object = await bucket.get(key);
  return object
    ? new Response(object.body, {
        headers: { 'Content-Type': object.httpMetadata.contentType ?? 'application/octet-stream' },
      })
    : null;
}

export async function deleteAsset(bucket: Env['ASSETS'], key: string): Promise<void> {
  await bucket.delete(key);
}

export async function listAssets(
  bucket: Env['ASSETS'],
  query?: string,
  page = 1,
  limit = 10,
): Promise<PaginatedAssets> {
  const list = await bucket.list();
  let keys = list.objects.map((object) => object.key);
  if (query) {
    const search = query.toLowerCase();
    keys = keys.filter((key) => key.toLowerCase().includes(search));
  }

  const total = keys.length;
  const offset = (page - 1) * limit;
  return {
    assets: keys.slice(offset, offset + limit),
    total,
  };
}
