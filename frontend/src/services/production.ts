import { fetchApi } from './api';

export interface ProductionOrder {
  id: number;
  storeId: number;
  businessLineId: number;
  targetQuantity: number;
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

export const ProductionAPI = {
  getDashboard: () => fetchApi('/production/dashboard') as Promise<DashboardKPIs>,
  listOrders: () => fetchApi('/production/orders') as Promise<ProductionOrder[]>,
  getOrder: (id: number) => fetchApi(`/production/orders/${id}`),
  createOrder: (data: any) =>
    fetchApi('/production/orders', { method: 'POST', body: JSON.stringify(data) }),
  editOrder: (id: number, data: any) =>
    fetchApi(`/production/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  startOrder: (id: number) => fetchApi(`/production/orders/${id}/start`, { method: 'POST' }),
  completeOrder: (id: number) => fetchApi(`/production/orders/${id}/complete`, { method: 'POST' }),
  cancelOrder: (id: number) => fetchApi(`/production/orders/${id}/cancel`, { method: 'POST' }),
};
