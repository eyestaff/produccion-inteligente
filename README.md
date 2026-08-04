# Producción inteligente

Starter para una PWA con Cloudflare Workers, D1 y R2.

[![CI](https://github.com/<tu-usuario>/<tu-repo>/actions/workflows/ci.yml/badge.svg)](https://github.com/<tu-usuario>/<tu-repo>/actions/workflows/ci.yml)

## Estructura

- `wrangler.toml` — configuración Cloudflare
- `src/index.ts` — Worker con rutas API y PWA
- `src/db.ts` — funciones de D1
- `src/storage.ts` — funciones de R2
- `public/sw.js` — service worker offline
- `public/manifest.webmanifest` — manifest PWA

## Instalación

```bash
cd ~/produccion-inteligente
npm install
npm run prepare
```

## Calidad de código

- `npm run lint` — ejecutar ESLint
- `npm run format` — formatear con Prettier
- `npm run format:check` — verificar el formato de Prettier
- `prepare` instala hooks de Husky para ejecutar `lint-staged` en `git commit`

## Configuración Cloudflare

1. `wrangler login`
2. Crear base de datos D1 y bucket R2 en el dashboard
3. En `wrangler.toml`, ajustar los nombres de `database_name` y `bucket_name` si es necesario

## Publicar en Cloudflare Workers

1. Asegúrate de tener `CF_API_TOKEN` y `CF_ACCOUNT_ID` configurados en el entorno local o en GitHub Secrets.
2. Ejecuta `npm run build` para verificar la compilación.
3. Publica con:

```bash
npm run deploy
```

Ambos comandos usan explícitamente `--env production` para evitar advertencias de Wrangler cuando hay múltiples entornos definidos.

4. Al finalizar, `wrangler publish` te mostrará la URL de Workers, por ejemplo:

```bash
https://produccion-inteligente.<tu-subdominio>.workers.dev
```

5. Si deseas un dominio propio, agrega tu dominio en Cloudflare y asocia el Worker a la ruta del dominio.

## Dominio personalizado

1. Añade tu dominio en el panel de Cloudflare.
2. Crea una ruta de Worker para el dominio, por ejemplo `example.com/*`.
3. Asegúrate de que el dominio esté configurado como activo en Cloudflare (DNS configurado y proxy habilitado si corresponde).
4. Si quieres mantener el mismo Worker para varios subdominios, usa una ruta con comodines como `*.example.com/*`.

Cuando el dominio esté configurado, tu aplicación se servirá desde ese dominio en lugar de la URL `workers.dev`.

## Comandos

- `npm run dev` — desarrollo local
- `npm run build` — compilar Worker
- `npm run typecheck` — verificar TypeScript sin generar archivos
- `npm run lint` — ejecutar ESLint
- `npm run format` — formatear el código con Prettier
- `npm run format:check` — verificar formato con Prettier
- `npm run test` — ejecutar pruebas unitarias
- `npm run deploy` — desplegar en Cloudflare
- `./create_record.sh registro.json` — crea un registro D1 local
- `./delete_record.sh 1` — elimina un registro D1 local
- `./list_records.sh` — lista registros D1 local
- `./search_records.sh consulta [pagina] [limite]` — busca registros D1 local
- `./get_record.sh 1` — obtiene un registro D1 por id local
- `./update_record.sh 1 sensor-1 80` — actualiza un registro D1 local
- `./upload_asset.sh ruta-al-archivo clave-en-r2` — sube un asset a R2 local
- `./search_assets.sh consulta [pagina] [limite]` — busca assets R2 local
- `./get_asset.sh clave-en-r2 archivo-destino` — descarga un asset desde R2 local
- `./delete_asset.sh clave-en-r2` — elimina un asset de R2 local
- `./list_assets.sh` — lista assets en R2 local

## CI/CD

- Añade el repo a GitHub.
- Configura los secrets `CF_API_TOKEN` y `CF_ACCOUNT_ID` en GitHub.
- La acción en `.github/workflows/ci.yml` valida compilación, TypeScript, ESLint y formato Prettier en cada push y PR.
- La acción en `.github/workflows/deploy.yml` desplegará automáticamente en cada push a `main`.
- Para más detalles de despliegue, consulta [DEPLOYMENT.md](./DEPLOYMENT.md).

## Endpoints

- `GET /` — interfaz PWA
- `GET /health` — estado
- `GET /api/records` — lista registros D1
- `GET /api/records?q=valor&page=1&limit=10` — busca registros D1 por nombre o valor con paginación
- `GET /api/records/:id` — obtener registro D1 por id
- `POST /api/records` — crear registro D1
- `PUT /api/records/:id` — actualizar registro D1
- `DELETE /api/records/:id` — eliminar registro D1
- `GET /api/assets` — listar assets R2
- `GET /api/assets?q=clave&page=1&limit=10` — buscar assets R2 por clave con paginación
- `DELETE /api/assets/:key` — eliminar asset R2
- `GET /api/assets/:key` — descargar asset R2
- `POST /api/assets` — subir asset a R2
- `GET /manifest.webmanifest` — manifest PWA
- `GET /sw.js` — service worker
- `GET /icon.svg` — icono de la PWA

## Ejemplos de uso

### Crear un registro en D1

```bash
curl -X POST http://127.0.0.1:8787/api/records \
  -H "Content-Type: application/json" \
  -d '{"name":"sensor-1","value":"75"}'
```

### Listar registros

```bash
curl http://127.0.0.1:8787/api/records
```

### Buscar registros

```bash
curl http://127.0.0.1:8787/api/records?q=sensor&page=1&limit=10
```

### Buscar registros localmente con script

```bash
./search_records.sh sensor 1 10
```

### Actualizar un registro

```bash
curl -X PUT http://127.0.0.1:8787/api/records/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"sensor-1","value":"80"}'
```

### Eliminar un registro

```bash
curl -X DELETE http://127.0.0.1:8787/api/records/1
```

### Subir un asset a R2

```bash
curl -X POST http://127.0.0.1:8787/api/assets \
  -H "Content-Type: application/json" \
  -d '{"key":"documento.txt","content":"VGhpcyBpcyBhbiBleGFtcGxlIGFzc2V0Lg=="}'
```

### Listar assets en R2

```bash
curl http://127.0.0.1:8787/api/assets
```

### Buscar assets en R2

```bash
curl http://127.0.0.1:8787/api/assets?q=documento&page=1&limit=10
```

### Buscar assets localmente con script

```bash
./search_assets.sh documento 1 10
```

### Descargar un asset

```bash
curl http://127.0.0.1:8787/api/assets/documento.txt
```

### Eliminar un asset

```bash
curl -X DELETE http://127.0.0.1:8787/api/assets/documento.txt
```

## PWA

La página principal incluye formularios para agregar y eliminar registros directamente desde la interfaz.

La aplicación usa un service worker y un manifest integrados para que funcione offline.

- `GET /manifest.webmanifest` devuelve el archivo de configuración de la PWA
- `GET /sw.js` devuelve el service worker
- `GET /icon.svg` devuelve el ícono de la aplicación
