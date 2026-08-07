import { fetchApi } from './api';

export type WasteReason =
  'caducity' | 'overproduction' | 'error' | 'breakage' | 'quality' | 'other';

export interface WasteRecord {
  id: number;
  storeId: number;
  productId: number;
  productName: string;
  quantity: number;
  reason: string;
  createdAt: string;
  createdBy: number;
  userEmail?: string;
  notes?: string;
}

export interface WasteMetrics {
  dailyWaste: number;
  weeklyWaste: number;
  topProduct: string;
  topProductWaste: number;
  estimatedCost: number;
  trend: number[];
}

export interface RegisterWastePayload {
  productId: number;
  quantity: number;
  reason: WasteReason;
  notes?: string;
}

export const wasteService = {
  async getMetrics(storeId: number): Promise<WasteMetrics> {
    return fetchApi(`/waste/${storeId}/metrics`);
  },

  async listWaste(
    storeId: number,
    filters?: { productId?: number; reason?: string; startDate?: string; endDate?: string },
  ): Promise<WasteRecord[]> {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', filters.productId.toString());
    if (filters?.reason) params.append('reason', filters.reason);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const qs = params.toString();
    return fetchApi(`/waste/${storeId}${qs ? '?' + qs : ''}`);
  },

  async registerWaste(
    storeId: number,
    payload: RegisterWastePayload,
  ): Promise<{ success: boolean; updatedStock: number }> {
    return fetchApi(`/waste/${storeId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
