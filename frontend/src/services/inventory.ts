import { fetchApi } from './api';

export interface InventoryItem {
  productId: number;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface InventoryTransaction {
  id: number;
  type: string;
  quantityChange: number;
  reason: string;
  createdBy: number;
  sourceModule: string;
  referenceType?: string;
  referenceId?: number;
  createdAt: string;
}

export type AdjustReason =
  'production' | 'caducity' | 'breakage' | 'adjustment' | 'theft' | 'return';

export const InventoryAPI = {
  getStoreInventory: (storeId: number) =>
    fetchApi(`/inventory/${storeId}`) as Promise<InventoryItem[]>,

  getProductTransactions: (storeId: number, productId: number) =>
    fetchApi(`/inventory/${storeId}/transactions/${productId}`) as Promise<InventoryTransaction[]>,

  adjustInventory: (storeId: number, productId: number, quantity: number, reason: AdjustReason) =>
    fetchApi(`/inventory/${storeId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, reason }),
    }) as Promise<InventoryItem>,
};
