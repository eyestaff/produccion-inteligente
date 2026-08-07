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

Evitar decisiones de diseño que dificulten esta evolución.
