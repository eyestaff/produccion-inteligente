# CONSTITUCIÓN DE INGENIERÍA

**Contrato Técnico Supremo del Proyecto (Hasta v1.0)**

## 1. PRODUCT FIRST

Toda decisión técnica deberá justificarse por el valor que aporta al producto. Nunca se implementará complejidad sin una necesidad funcional clara.

## 2. DOMAIN FIRST

Antes de implementar cualquier dominio deberá existir un `DOMAIN_DESIGN_<DOMINIO>.md` debidamente aprobado. No se escribirá una sola línea de código sin un diseño funcional previo.

## 3. REQUESTCONTEXT

`RequestContext` es el único contrato autorizado para transportar el contexto autenticado de ejecución a través de las capas. Nunca volverán a introducirse parámetros aislados (como `companyId`, `userId`) sueltos en las firmas.

## 4. MULTI-TENANT

Toda entidad nueva nace siendo Multi-tenant por defecto. Toda consulta o modificación a base de datos deberá respetar el aislamiento de empresa filtrando por `RequestContext.companyId`.

## 5. LEDGER

Todo dato crítico deberá ser auditable de forma inmutable. Siempre que exista un Snapshot o estado actual proyectado, deberá existir obligatoriamente un Ledger (historial de transacciones) subyacente que permita reconstruirlo.

## 6. EVENTS

Todo dominio deberá identificar (y en el futuro publicar) los Domain Events (eventos de dominio) que produce y que puedan ser relevantes para otros subsistemas.

## 7. AI READY

Todo diseño de dominio deberá explicar obligatoriamente:

- Qué información consumirá la Inteligencia Artificial.
- Qué información generará para la Inteligencia Artificial.

## 8. KPI READY

Todo diseño de dominio deberá identificar qué KPIs (indicadores clave de rendimiento) produce.

## 9. ESCALABILIDAD

Todo diseño deberá explicar cómo evolucionará y se mantendrá robusto si el sistema multiplica por 100 su tamaño y volumetría de datos.

## 10. DOCUMENTACIÓN

Toda decisión importante deberá actualizar simultáneamente los pilares del proyecto:

- `AI_CONTEXT.md`
- `DECISIONS.md`
- `PRODUCT_BACKLOG.md`
- El correspondiente documento `DOMAIN_DESIGN_<DOMINIO>.md`

## 11. CALIDAD

Ningún Sprint podrá darse por cerrado sin haber ejecutado y superado exitosamente el pipeline completo:

- lint
- typecheck
- tests
- build
- deploy

## 12. DEUDA TÉCNICA

Toda deuda técnica deberá estar:

- Documentada y registrada.
- Priorizada por impacto.
- Asignada a un Sprint futuro concreto.
  No existirá deuda técnica indefinida o ignorada.

## 13. PRINCIPIO DE SIMPLICIDAD

La solución más simple que satisfaga correctamente el dominio será siempre la solución preferida. Evitar la sobreingeniería a toda costa.

## 14. COMPATIBILIDAD

Toda decisión de diseño deberá valorar su impacto colateral sobre los demás módulos críticos: Producción, Inventario, Forecast, Compras, IA y Dashboards.

## 15. GOBERNANZA

Ningún cambio arquitectónico importante podrá implementarse de forma directa. Todo cambio requiere: propuesta, justificación, evaluación de alternativas, y aprobación final.
