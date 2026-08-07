# Reglas Arquitectónicas del Proyecto

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
  userId: string;
  companyId: string;
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

Evitar decisiones de diseño que dificulten esta evolución.
