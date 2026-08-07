import { ProductForecastContext } from '../db/forecast.provider';

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

export function generateForecast(context: ProductForecastContext[]): ForecastDashboardResult {
  const recommendations: ForecastRecommendation[] = [];
  const risks: ForecastRisk[] = [];

  for (const item of context) {
    const daily7 = item.consumption7d / 7;
    const daily30 = item.consumption30d / 30;

    let trend = 0;
    if (daily30 > 0) {
      trend = ((daily7 - daily30) / daily30) * 100;
    }

    // Determine confidence
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    if (daily30 > 0 && daily7 > 0) {
      if (Math.abs(trend) < 15) confidence = 'High';
      else if (Math.abs(trend) < 40) confidence = 'Medium';
      else confidence = 'Low';
    }

    const type = item.type !== 'raw_material' ? 'produce' : 'buy';
    const pending = item.type !== 'raw_material' ? item.pendingProduction : item.pendingPurchases;

    // Smart Group Protocol: Sugerencia = (Histórico_Bianual * Tendencia) + Margen_5% - Stock - Mermas
    // Since MVP uses 30d as base (Histórico) and 7d vs 30d as trend
    const baseHistorical = daily30;
    const trendFactor = 1 + trend / 100;
    const calculatedDemand = baseHistorical * trendFactor;

    // Margen de seguridad 5%
    const zFactor = calculatedDemand * 0.05;

    const target = calculatedDemand + zFactor;

    const deficit = target - (item.availableQuantity + pending);
    const suggestedQuantity = deficit > 0 ? Math.ceil(deficit + item.recentWaste) : 0;

    if (suggestedQuantity > 0) {
      // Build reasons array
      const reasons: string[] = [];
      reasons.push(`Consumo medio últimos 7 días: ${daily7.toFixed(1)}/día.`);
      reasons.push(`Tendencia mensual: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}%.`);
      reasons.push(`Stock disponible: ${item.availableQuantity} unidades.`);
      if (pending > 0)
        reasons.push(
          `${type === 'produce' ? 'Producción' : 'Compras'} pendiente: ${pending} unidades.`,
        );
      if (item.recentWaste > 0)
        reasons.push(`Mermas recientes a compensar: ${item.recentWaste} unidades.`);

      recommendations.push({
        productId: item.productId,
        productName: item.productName,
        type,
        suggestedQuantity,
        reasons,
        confidence,
        metrics: {
          consumption7d: item.consumption7d,
          consumption30d: item.consumption30d,
          trend,
          availableQuantity: item.availableQuantity,
          pending,
          recentWaste: item.recentWaste,
        },
      });
    }

    // Risk calculation
    const daysOfStock = daily7 > 0 ? (item.availableQuantity + pending) / daily7 : null;

    if (item.availableQuantity < 0) {
      risks.push({
        productId: item.productId,
        productName: item.productName,
        type: 'stockout',
        severity: 'high',
        message: `Stock negativo (${item.availableQuantity}). Riesgo crítico de parada.`,
      });
    } else if (daysOfStock !== null && daysOfStock < 1) {
      risks.push({
        productId: item.productId,
        productName: item.productName,
        type: 'stockout',
        severity: 'high',
        message: `Stock se agotará en menos de 24h a este ritmo.`,
      });
    }

    if (item.maxStock > 0 && item.availableQuantity > item.maxStock * 1.5) {
      risks.push({
        productId: item.productId,
        productName: item.productName,
        type: 'overstock',
        severity: 'medium',
        message: `Sobrestock detectado. El inventario supera el máximo por un 50%.`,
      });
    }
  }

  // Sort recommendations by confidence and suggested quantity
  recommendations.sort((a, b) => {
    const confVal = { High: 3, Medium: 2, Low: 1 };
    if (confVal[a.confidence] !== confVal[b.confidence]) {
      return confVal[b.confidence] - confVal[a.confidence];
    }
    return b.suggestedQuantity - a.suggestedQuantity;
  });

  return {
    recommendations,
    risks,
    updatedAt: new Date().toISOString(),
  };
}
