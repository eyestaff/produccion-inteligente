import { fetchApi } from './api';

export interface ForecastRecommendation {
  productId: number;
  productName: string;
  type: 'produce' | 'buy';
  suggestedQuantity: number;
  reasons: string[];
  confidence: 'High' | 'Medium' | 'Low';
  metrics: {
    consumption7d: number;
    consumption30d: number;
    trend: number;
    availableQuantity: number;
    pending: number;
    recentWaste: number;
  };
}

export interface ForecastRisk {
  productId: number;
  productName: string;
  type: 'stockout' | 'overstock' | 'anomaly';
  severity: 'high' | 'medium';
  message: string;
}

export interface ForecastDashboardResult {
  recommendations: ForecastRecommendation[];
  risks: ForecastRisk[];
  updatedAt: string;
}

export interface ForecastHistoryItem {
  id: number;
  targetDate: string;
  status: string;
  createdAt: string;
  productId: number;
  productName: string;
  suggestedQuantity: number;
  adjustedQuantity: number;
  actualConsumption: number;
  deviationPercentage: number;
}

export const ForecastAPI = {
  getDashboard: (storeId: number) =>
    fetchApi(`/forecast/${storeId}/dashboard`) as Promise<ForecastDashboardResult>,
  getHistory: (storeId: number) =>
    fetchApi(`/forecast/${storeId}/history`) as Promise<ForecastHistoryItem[]>,
  approvePlan: (storeId: number, targetDate: string, items: any[]) =>
    fetchApi(`/forecast/${storeId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ targetDate, items }),
    }),
};
