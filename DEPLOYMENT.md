# Despliegue en Cloudflare Workers

Este documento cubre los pasos para publicar el proyecto en Cloudflare Workers y, opcionalmente, configurar un dominio personalizado.

## Requisitos previos

- Tener `wrangler` instalado.
- Haber iniciado sesión con `wrangler login`.
- Tener un token válido de Cloudflare con permisos de Workers.
- Tener `CF_API_TOKEN` y `CF_ACCOUNT_ID` configurados en tu entorno o en GitHub Secrets.

## Publicar desde local

1. Instala dependencias:

   ```bash
   npm install
   npm run prepare
   ```

2. Verifica la compilación:

   ```bash
   npm run build
   ```

3. Publica el Worker:

   ```bash
   npm run deploy
   ```

4. Al terminar, Wrangler mostrará la URL de Workers. Debe ser similar a:

   ```bash
   https://produccion-inteligente.<tu-subdominio>.workers.dev
   ```

## Configurar GitHub Actions para despliegue automático

1. Comprueba que `.github/workflows/deploy.yml` exista y contenga `npm run deploy`.
2. Configura los secrets en el repositorio de GitHub:
   - `CF_API_TOKEN`
   - `CF_ACCOUNT_ID`
3. Cada push a `main` ejecutará el despliegue automáticamente.

## Configuración de dominio personalizado

1. Agrega tu dominio en Cloudflare.
2. En la sección "Workers" de Cloudflare, crea una ruta para el Worker, por ejemplo:
   - `example.com/*`
   - `*.example.com/*`
3. Asegúrate de que el dominio esté activo y correctamente configurado en DNS.
4. Si usas HTTPS, Cloudflare gestionará el certificado automáticamente.

## Notas importantes

- El proyecto está configurado para usar el entorno `production` en `worker/wrangler.toml`.
- El script `npm run deploy` ejecuta `wrangler deploy --env production`.
- Si en el futuro necesitas múltiples entornos, agrega nuevas secciones `env.<nombre>` en `worker/wrangler.toml`.
