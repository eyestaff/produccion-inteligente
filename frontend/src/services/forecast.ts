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

export const ForecastAPI = {
  getDashboard: (storeId: number) =>
    fetchApi(`/forecast/${storeId}/dashboard`) as Promise<ForecastDashboardResult>,
};
