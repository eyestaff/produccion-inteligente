import type { RequestContext } from '../../worker/models/context';

export function createMockContext(companyId: number, role: string = 'admin'): RequestContext {
  return {
    userId: 1,
    companyId,
    role,
  };
}
