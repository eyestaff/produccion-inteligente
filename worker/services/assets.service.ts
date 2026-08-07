import type { Env } from '../index';
import { deleteAsset, getAsset, listAssets, uploadAsset } from '../storage';
import type { PaginatedAssets } from '../models/assets';

export class AssetsService {
  constructor(private bucket: Env['ASSETS']) {}

  async listAssets(query?: string, page = 1, limit = 10): Promise<PaginatedAssets> {
    return listAssets(this.bucket, query, page, limit);
  }

  async uploadAsset(
    key: string,
    body: string | ArrayBuffer | ArrayBufferView | Blob | ReadableStream<any> | null,
  ): Promise<void> {
    await uploadAsset(this.bucket, key, body);
  }

  async getAsset(key: string): Promise<Response | null> {
    return getAsset(this.bucket, key);
  }

  async removeAsset(key: string): Promise<void> {
    await deleteAsset(this.bucket, key);
  }
}
