import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import {
  listStoreInventory,
  listInventoryTransactions,
  recordInventoryTransaction,
  getInventorySnapshot,
} from '../db/repositories';

export class InventoryService {
  constructor(
    private db: Env['DB'],
    private ctx: RequestContext,
  ) {}

  async getStoreInventory(storeId: number) {
    return listStoreInventory(this.db, this.ctx, storeId);
  }

  async getTransactions(storeId: number, productId: number) {
    return listInventoryTransactions(this.db, this.ctx, storeId, productId);
  }

  async adjustInventory(
    storeId: number,
    productId: number,
    quantity: number,
    reason: 'production' | 'caducity' | 'breakage' | 'adjustment' | 'theft' | 'return',
  ) {
    if (!quantity) throw new Error('INVALID_QUANTITY');
    const validReasons = ['production', 'caducity', 'breakage', 'adjustment', 'theft', 'return'];
    if (!validReasons.includes(reason)) throw new Error('INVALID_REASON');

    await recordInventoryTransaction(this.db, this.ctx, {
      storeId,
      productId,
      type: quantity > 0 ? 'in' : 'out',
      quantityChange: quantity,
      reason,
      sourceModule: 'ManualAdjustment',
    });

    return getInventorySnapshot(this.db, this.ctx, storeId, productId);
  }

  async reserveForProduction(
    storeId: number,
    productId: number,
    quantity: number,
    orderId: number,
  ) {
    if (quantity <= 0) throw new Error('INVALID_QUANTITY');

    await recordInventoryTransaction(this.db, this.ctx, {
      storeId,
      productId,
      type: 'adjustment', // Reserving doesn't change physical stock, just available
      quantityChange: quantity,
      reason: 'production',
      sourceModule: 'ProductionEngine',
      referenceType: 'ProductionOrder',
      referenceId: orderId,
      isReserveOnly: true,
    });
    return getInventorySnapshot(this.db, this.ctx, storeId, productId);
  }
}
