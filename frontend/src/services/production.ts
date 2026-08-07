import { fetchApi } from './api';

export interface ProductionOrder {
  id: number;
  storeId: number;
  businessLineId: number;
  targetQuantity: number;
  actualQuantity?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DashboardKPIs {
  planned: number;
  inProgress: number;
  completed: number;
  alerts: any[];
}

export interface PrepSheet {
  orderId: number;
  ingredients: { productId: number; productName: string; quantity: number; unit: string }[];
}

export const ProductionAPI = {
  getDashboard: () => fetchApi('/production/dashboard') as Promise<DashboardKPIs>,
  listOrders: () => fetchApi('/production/orders') as Promise<ProductionOrder[]>,
  getOrder: (id: number) => fetchApi(`/production/orders/${id}`),
  createOrder: (data: any) =>
    fetchApi('/production/orders', { method: 'POST', body: JSON.stringify(data) }),
  editOrder: (id: number, data: any) =>
    fetchApi(`/production/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  startOrder: (id: number) => fetchApi(`/production/orders/${id}/start`, { method: 'POST' }),
  completeOrder: (id: number, actualQuantity?: number, wasteQuantity?: number) =>
    fetchApi(`/production/orders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ actualQuantity, wasteQuantity }),
    }),
  cancelOrder: (id: number) => fetchApi(`/production/orders/${id}/cancel`, { method: 'POST' }),
  getPrepSheet: (id: number) =>
    fetchApi(`/production/orders/${id}/prep-sheet`) as Promise<PrepSheet>,
};
