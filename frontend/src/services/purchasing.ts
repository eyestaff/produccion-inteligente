import { fetchApi } from './api';

export type PurchaseReason =
  'negative_stock' | 'below_minimum' | 'high_consumption' | 'recent_waste';
export type PurchaseStatus = 'pending' | 'bought' | 'postponed' | 'discarded';

export interface ReplenishmentNeed {
  productId: number;
  productName: string;
  physicalStock: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reservedQuantity: number;
  reason: PurchaseReason;
  reasonLabel: string;
  suggestedQuantity: number;
  targetStock: number;
  priority: number;
  consumption7d: number;
  recentWaste48h: number;
  wasteReasons: string | null;
  daysOfStockRemaining: number | null;
  impactIfNotBought: string;
}

export interface PurchaseRequest {
  id: number;
  productId: number;
  productName: string;
  reason: PurchaseReason;
  suggestedQuantity: number;
  status: PurchaseStatus;
  notes?: string;
  discardedReason?: string;
  discardedAt?: string;
  accepted?: number;
  stockoutOccurred?: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export const DISCARD_REASONS = [
  'Ya tengo suficiente stock',
  'El proveedor no tiene disponibilidad',
  'Producto fuera de temporada',
  'Precio no es conveniente ahora',
  'Error en la detección',
  'Otro motivo',
] as const;

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

  discard: (requestId: number, reason: string) =>
    fetchApi(`/purchasing/requests/${requestId}/discard`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  setLevels: (storeId: number, productId: number, minStock: number, maxStock: number) =>
    fetchApi(`/purchasing/${storeId}/levels`, {
      method: 'POST',
      body: JSON.stringify({ productId, minStock, maxStock }),
    }),
};
