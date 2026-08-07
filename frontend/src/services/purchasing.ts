import { fetchApi } from './api';

export type PurchaseReason =
  'negative_stock' | 'below_minimum' | 'high_consumption' | 'recent_waste';
export type PurchaseStatus = 'pending' | 'bought' | 'postponed';

export interface ReplenishmentNeed {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reason: PurchaseReason;
  reasonLabel: string;
  suggestedQuantity: number;
  priority: number;
}

export interface PurchaseRequest {
  id: number;
  productId: number;
  productName: string;
  reason: PurchaseReason;
  suggestedQuantity: number;
  status: PurchaseStatus;
  notes?: string;
  currentStock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export const PurchasingAPI = {
  getNeeds: (storeId: number) =>
    fetchApi(`/purchasing/${storeId}/needs`) as Promise<ReplenishmentNeed[]>,

  getRequests: (storeId: number) =>
    fetchApi(`/purchasing/${storeId}/requests`) as Promise<PurchaseRequest[]>,

  createRequest: (
    storeId: number,
    data: { productId: number; reason: PurchaseReason; suggestedQuantity: number },
  ) => fetchApi(`/purchasing/${storeId}/requests`, { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (requestId: number, status: PurchaseStatus, notes?: string) =>
    fetchApi(`/purchasing/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  setLevels: (storeId: number, productId: number, minStock: number, maxStock: number) =>
    fetchApi(`/purchasing/${storeId}/levels`, {
      method: 'POST',
      body: JSON.stringify({ productId, minStock, maxStock }),
    }),
};
