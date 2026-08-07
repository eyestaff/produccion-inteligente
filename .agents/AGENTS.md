# Reglas Arquitectónicas del Proyecto

> **REFERENCIA SUPREMA:** El contrato técnico supremo de este proyecto, que gobierna sobre cualquier otra norma hasta la versión 1.0, es la [Constitución de Ingeniería](file:///Users/nelsoncarrillokosak/produccion-inteligente/ENGINEERING_CONSTITUTION.md). Todos los agentes deben respetarla de forma ineludible.

## Seguridad por defecto

- Ningún repositorio podrá ejecutar consultas sobre datos de negocio sin disponer del contexto de empresa (`companyId`).
- Ningún servicio podrá acceder a un repositorio sin dicho contexto.
- Ninguna ruta autenticada podrá acceder a datos sin un `AuthContext` válido.
- El cliente nunca podrá indicar ni modificar el `companyId`.
- El `companyId` siempre deberá obtenerse exclusivamente desde la sesión autenticada.

## Evolución hacia RequestContext

La arquitectura debe prepararse para evolucionar hacia un único `RequestContext` compartido en lugar de propagar únicamente `companyId` entre capas. El futuro `RequestContext` será similar a:

```typescript
interface RequestContext {
  userId: number;
  companyId: number;
  role: string;
}
```

Todas las capas nuevas del sistema deberán diseñarse para aceptar un RequestContext en lugar de parámetros aislados.
Objetivos:

- Eliminar el paso manual de `companyId` entre capas.
- Centralizar la información del usuario autenticado.
- Facilitar futuras extensiones (permisos, locale, timezone, feature flags, auditoría, tracing).
- Reducir errores de seguridad.
- Mantener una arquitectura consistente.

## Reglas Permanentes de Ingeniería (Desde Sprint 6)

1. **Contrato Oficial:** `RequestContext` será el único contrato oficial para transportar el contexto autenticado.
2. **Sin Legacy:** No se permitirá introducir nuevas compatibilidades legacy.
3. **Excepciones Temporales:** Toda excepción temporal deberá documentarse en `DECISIONS.md` indicando: motivo, impacto, y Sprint de eliminación.
4. **Registro de Deuda Técnica:** Toda deuda técnica deberá registrar su descripción, motivo, impacto, prioridad y Sprint objetivo para su eliminación en `DECISIONS.md` o en el backlog.
5. **Revisión de Deuda:** Antes de cerrar cada Sprint se revisará si existe deuda técnica que pueda eliminarse inmediatamente.
6. **Decisiones Arquitectónicas:** Si se detecta una decisión arquitectónica mejor, NO se implementará directamente. Se propondrá primero analizando ventajas, inconvenientes y riesgos, esperando aprobación.
7. **Sincronización:** Mantener siempre sincronizados `AI_CONTEXT.md`, `DECISIONS.md`, `PRODUCT_BACKLOG.md` y `PROJECT_ROADMAP.md` ante cualquier cambio arquitectónico o funcional.
8. **Ciclo de Trabajo Obligatorio:** Planificación -> Aprobación -> Implementación -> Evidencias -> Revisión arquitectónica -> Actualización docs -> Aprobación final -> Planificación siguiente Sprint.
9. **Diseño de Dominios Funcionales:** Todo nuevo dominio deberá disponer de su correspondiente documento `DOMAIN_DESIGN_<DOMINIO>.md` que incluya objetivo, alcance, entidades, relaciones, reglas de negocio, invariantes, ciclo de vida, casos límite, impacto en otros dominios, modelo de datos, API, estrategia de pruebas, riesgos y alternativas consideradas. Nunca se escribirá código sin aprobar primero su diseño.
10. **Preguntas Obligatorias de Diseño:** A partir del Sprint 7, antes de implementar cualquier nuevo dominio se deberán responder explícitamente estas cuatro preguntas dentro de su DOMAIN_DESIGN:
    1. ¿Cómo escalará este dominio dentro de cinco años?
    2. ¿Qué información necesitará consumir la IA?
    3. ¿Qué KPIs producirá este dominio?
    4. ¿Qué eventos publicará este dominio al resto del sistema?
11. **Higiene de Sprints y Git:**
    - Ningún Sprint podrá incluir cambios pertenecientes a otro Sprint.
    - Antes de comenzar un Sprint verificar que el working tree está limpio; de lo contrario detenerse e informar.
    - Prohibido usar `git add .` para cerrar un Sprint sin verificar archivos modificados.
    - Revisar el diff antes de cada commit.
    - Si se corrige un error heredado (ej. para pasar lint/typecheck/build), debe documentarse como "Correcciones incidentales" en el informe final.
