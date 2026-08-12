import { ForecastDashboardResult } from './forecast.engine';

export async function enhanceForecastWithAI(
  forecastResult: ForecastDashboardResult,
  ai: any,
): Promise<ForecastDashboardResult> {
  // Solo pasamos a la IA las recomendaciones que tengan datos significativos
  // para no saturar el prompt.
  const recsToAnalyze = forecastResult.recommendations.filter(
    (r) => r.suggestedQuantity > 0 || r.metrics.recentWaste > 0,
  );

  if (recsToAnalyze.length === 0 || !ai) {
    return forecastResult;
  }

  // Preparamos el contexto para el modelo
  const promptData = recsToAnalyze.map((r) => ({
    id: r.productId,
    product: r.productName,
    type: r.type,
    baseDemand: r.suggestedQuantity,
    trend: r.metrics.trend,
    waste: r.metrics.recentWaste,
    available: r.metrics.availableQuantity,
    pending: r.metrics.pending,
  }));

  const systemPrompt = `Eres un experto planificador de supply chain y S&OP.
Se te proporciona un JSON con una lista de productos y la sugerencia determinista de producción/compra actual ('baseDemand').
Analiza las variables ('trend', 'waste', 'available', 'pending'). 
Tu objetivo es sugerir ajustes a 'baseDemand' solo si detectas un riesgo significativo (ej. tendencia muy alta, o muchas mermas que podrían requerir ajustar la producción).
Devuelve EXCLUSIVAMENTE un objeto JSON válido con este esquema:
{
  "adjustments": [
    {
      "id": <product_id>,
      "adjustedDemand": <nueva_cantidad_numerica>,
      "reason": "<corta justificación de tu decisión>"
    }
  ]
}
No devuelvas ningún otro texto, solo el JSON.`;

  const userPrompt = JSON.stringify(promptData, null, 2);

  try {
    const aiResponse = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    let responseText = aiResponse.response || '';

    // Attempt to extract JSON from markdown if the model wrapped it
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    const aiResult = JSON.parse(responseText);

    if (aiResult && aiResult.adjustments && Array.isArray(aiResult.adjustments)) {
      const adjustmentMap = new Map<number, { adjustedDemand?: number; reason?: string }>(
        aiResult.adjustments.map((a: any) => [a.id, a]),
      );

      const newRecommendations = forecastResult.recommendations.map((r) => {
        const adj = adjustmentMap.get(r.productId);
        if (
          adj &&
          typeof adj.adjustedDemand === 'number' &&
          adj.adjustedDemand !== r.suggestedQuantity
        ) {
          return {
            ...r,
            suggestedQuantity: Math.max(0, Math.ceil(adj.adjustedDemand)),
            reasons: [
              ...r.reasons,
              `🤖 Ajuste IA: ${adj.reason} (De ${r.suggestedQuantity} a ${Math.ceil(adj.adjustedDemand)})`,
            ],
            confidence: 'High' as 'High' | 'Medium' | 'Low', // La IA aumenta la confianza
          };
        }
        return r;
      });

      return {
        ...forecastResult,
        recommendations: newRecommendations,
      };
    }

    return forecastResult;
  } catch (err) {
    console.error('Error AI enhancement:', err);
    // Fallback a los resultados deterministas
    return forecastResult;
  }
}
