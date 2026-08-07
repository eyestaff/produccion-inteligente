import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import {
  listStoreInventory,
  listInventoryTransactions,
  recordInventoryTransaction,
  getInventorySnapshot,
  executeAtomicBackflush,
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

  async executeProductionBackflush(
    orderId: number,
    storeId: number,
    ingredientsOut: { productId: number; quantity: number }[],
    productsIn: { productId: number; quantity: number }[],
  ) {
    // Generates Domain Event mockup here later
    await executeAtomicBackflush(this.db, this.ctx, orderId, storeId, ingredientsOut, productsIn);
    return true;
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

  async releaseFromProduction(
    storeId: number,
    productId: number,
    quantity: number,
    orderId: number,
  ) {
    if (quantity <= 0) throw new Error('INVALID_QUANTITY');

    await recordInventoryTransaction(this.db, this.ctx, {
      storeId,
      productId,
      type: 'adjustment',
      quantityChange: -quantity, // Negative to reduce reservation
      reason: 'production',
      sourceModule: 'ProductionEngine',
      referenceType: 'ProductionOrder',
      referenceId: orderId,
      isReserveOnly: true,
    });
    return getInventorySnapshot(this.db, this.ctx, storeId, productId);
  }

  // Se usa para compras
  async createTransaction(input: {
    storeId: number;
    productId: number;
    type: 'in' | 'out' | 'adjustment';
    quantityChange: number;
    reason: string;
    sourceModule?: string;
    referenceType?: string;
    referenceId?: number;
  }) {
    await recordInventoryTransaction(this.db, this.ctx, {
      storeId: input.storeId,
      productId: input.productId,
      type: input.type,
      quantityChange: input.quantityChange,
      reason: input.reason,
      sourceModule: input.sourceModule || 'ManualAdjustment',
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    });
    return getInventorySnapshot(this.db, this.ctx, input.storeId, input.productId);
  }
}
