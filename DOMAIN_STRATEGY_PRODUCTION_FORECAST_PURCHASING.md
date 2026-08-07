# ESTRATEGIA CONJUNTA DE DOMINIOS: Producción, Forecast y Compras

**Proyecto:** Producción Inteligente

---

## 1. Interacción de los dominios

El ciclo logístico-productivo es un flujo circular cerrado:

- **Forecast** analiza las ventas pasadas y la rotura de stock para predecir la demanda futura (cuánto venderemos).
- **Producción** toma la demanda del Forecast, aplica las `Recipes` y determina qué cantidad de materias primas e insumos se van a necesitar, descontando stock (`Inventory`) cuando finaliza.
- **Compras** observa el plan de Producción (o el Forecast) cruzándolo con el `Inventory` actual (disponible). Si el disponible no cubre la demanda prevista más un stock de seguridad, genera Requerimientos de Compra. Al recibir el material, inyecta el stock nuevamente al Inventario.

## 2. Información producida

- **Producción:** Órdenes de Producción (Planificadas, En progreso, Completadas), Consumo real de materiales, Mermas de fabricación (Waste), Producto final generado.
- **Forecast:** Predicciones de demanda diaria/semanal, Tendencias estacionales, Patrones de rotura de stock.
- **Compras:** Requerimientos de Compra, Órdenes de Compra (Draft, Enviadas, Recibidas), Coste Lote (Landed Cost), Tiempos de Entrega (Lead Times) de proveedores.

## 3. Información consumida

- **Producción:** Recetas (Ingredientes y Yield), Inventario (Stock disponible para reservar), Forecast (Para saber cuánto producir si no se basa en ventas confirmadas).
- **Forecast:** Histórico de Ventas (externo), Histórico de Mermas por caducidad (Inventario), Stockouts.
- **Compras:** Inventario (Stock disponible), Producción (Demandas de consumo programado), Forecast (Proyección de consumo a largo plazo).

## 4. Domain Events intercambiados

- `DemandForecastGenerated`: Dispara sugerencias de órdenes de Producción.
- `ProductionOrderPlanned`: Dispara reserva de ingredientes en Inventario.
- `ProductionOrderMaterialShortage`: Emitido si Producción no puede reservar stock. Gatilla una alerta rápida a Compras.
- `ProductionOrderCompleted`: Dispara consumo real (backflush) en Inventario y creación de producto terminado.
- `PurchaseOrderReceived`: Dispara ingreso en Inventario (Ledger IN) y avisa a Producción de que materiales retenidos ya están disponibles.

## 5. Dependencias cruzadas

- **Producción** depende de **Inventario** (para reservar) y de **Recetas** (para explotar).
- **Forecast** depende de **Ventas** (Histórico) e **Inventario** (Roturas).
- **Compras** depende de **Inventario** (para reponer), de **Proveedores** (nuevo maestro) y de **Producción** (para anticipar consumos fuertes).

## 6. APIs Internas a exponer

- **API Producción:** `POST /api/internal/production/simulate` (Explosiona una lista de productos a fabricar para que Compras sepa qué insumos harán falta).
- **API Forecast:** `GET /api/internal/forecast/demand?storeId=X&productId=Y&days=Z` (Retorna la cantidad sugerida).
- **API Compras:** `POST /api/internal/purchasing/requirements` (Permite que Producción o Inventario soliciten abastecimiento automático por escasez).

## 7. Decisiones críticas para evitar refactorizaciones

1. **Acoplamiento Asíncrono vs Síncrono:** No llamar a las APIs directamente mediante promesas HTTP/Servicios monolíticos de bloqueo. Deben comunicarse mediante Eventos de Dominio en segundo plano (o en capa de middleware transaccional), para que si Compras falla, Producción no se bloquee.
2. **La Unidad de Medida Estándar:** Compras trabaja en "Pallets" o "Sacos de 25kg", Producción trabaja en "Lotes de 10kg", Recetas en "Gramos". Se DEBE consolidar una Tabla de Conversión de Unidades desde el minuto cero en el Catálogo, o Compras calculará mal.
3. **Múltiples Almacenes:** Asumir que la entrega de Compras va a un "Almacén General" pero Producción consume del "Almacén de Obrador". Si no se separan ahora, no habrá trazabilidad real.

## 8. Dominio inicial a implementar (y por qué)

**1º PRODUCCIÓN.**
_Justificación:_ Actualmente, Inventario no sufre deducciones reales basadas en escandallos porque Producción no existe. Sin Producción, el flujo logístico se basa en ajustes manuales (falsos). Producción es el corazón del ERP; cierra el diseño de Recetas e Inventario. Construir Forecast o Compras antes que Producción significaría predecir o comprar sobre un stock que no se deduce sistemáticamente.

## 9. Desarrollo en paralelo

- Una vez afianzado el Motor de Producción, **Forecast** y **Compras** pueden desarrollarse en paralelo.
- **Forecast** puede ser construido por un equipo Data/Backend analizando el histórico de ventas (si existe).
- **Compras** puede ser construido enfocándose en el alta de Proveedores, Catálogo de Precios y recepción en almacén, mientras el equipo de Forecast refina los algoritmos.

## 10. Riesgos de un orden incorrecto

- _Si construimos Forecast primero:_ Sugerirá números sobre una base de datos sin historial real de mermas o producción estructurada. Predicciones inútiles.
- _Si construimos Compras primero:_ Se comprarán ingredientes para un motor de Producción inexistente. El stock crecerá en base de datos sin vía de descarga (backflushing).

## 11. Impacto sobre los cimientos actuales

- **Inventario:** Será sometido a estrés masivo (Ledger). Recibirá transacciones masivas de tipo `production_in`, `production_out` y `purchase_in`.
- **Recetas:** Se pondrá a prueba el cálculo de `yield_quantity` (ADR-007) durante la explosión de materiales masiva de Producción.
- **KPIs:** Se iluminarán los indicadores financieros reales (Costo de Bienes Vendidos - COGS) y precisión de inventario, dado que se restará de forma exacta y no a estima.
- **IA:** Empezará a recibir el volumen de datos necesario: Mermas de producción, lead times de compras reales, y desviaciones entre la receta teórica y el consumo real.

## 12. Roadmap Óptimo hasta la v1.0

1. **Sprint 8: Motor de Producción.** (Depende de: Recetas e Inventario). _Objetivo:_ Cerrar el flujo de consumo y generar producto terminado mediante "Production Orders".
2. **Sprint 9: Módulo de Compras (Purchasing).** (Depende de: Producción). _Objetivo:_ Formalizar la entrada de mercancía, lotes, proveedores y landed cost.
3. **Sprint 10: Inteligencia Predictiva (Forecast).** (Depende de: Producción y Compras). _Objetivo:_ Cerrar el flujo leyendo el historial y sugiriendo qué Producir y qué Comprar.
4. **Sprint 11: Analítica y Dashboards.** _Objetivo:_ Exponer todo el conocimiento acumulado en vistas ejecutivas (Mermas, Costos, Rotaciones).
5. **Sprint 12: Readiness v1.0.** Bugfixing, optimizaciones de D1 y Auditoría de Seguridad general.
