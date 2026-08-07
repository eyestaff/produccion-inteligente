import type { RequestContext } from '../models/context';
import type { Env } from '../index';
import { deleteAsset, getAsset, listAssets, uploadAsset } from '../storage';
import type { PaginatedAssets } from '../models/assets';

export class AssetsService {
  constructor(
    private bucket: Env['ASSETS'],
    private ctx: RequestContext,
  ) {}

  private getKey(key: string): string {
    return `company_${this.ctx.companyId}/${key}`;
  }

  async listAssets(query?: string, page = 1, limit = 10): Promise<PaginatedAssets> {
    const prefixQuery = query
      ? `company_${this.ctx.companyId}/${query}`
      : `company_${this.ctx.companyId}/`;
    const res = await listAssets(this.bucket, prefixQuery, page, limit);
    // strip the prefix from the returned keys for client convenience
    const strippedAssets = res.assets.map((a) => ({
      ...a,
      key: a.key.replace(`company_${this.ctx.companyId}/`, ''),
    }));
    return { ...res, assets: strippedAssets };
  }

  async uploadAsset(
    key: string,
    body: string | ArrayBuffer | ArrayBufferView | Blob | ReadableStream<any> | null,
  ): Promise<void> {
    await uploadAsset(this.bucket, this.getKey(key), body);
  }

  async getAsset(key: string): Promise<Response | null> {
    return getAsset(this.bucket, this.getKey(key));
  }

  async removeAsset(key: string): Promise<void> {
    await deleteAsset(this.bucket, this.getKey(key));
  }
}
