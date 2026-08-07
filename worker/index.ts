import { initializeDb } from './db';
import {
  addRecord,
  deleteRecord,
  getRecordById,
  getRecords,
  updateRecord,
} from './repositories/records.repository';
import { deleteAsset, getAsset, listAssets, uploadAsset } from './storage';
import { renderAppToHtml } from '../frontend/src/ui/renderApp';

import { MANIFEST, SERVICE_WORKER, ICON_SVG } from './pwa';

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  PROJECT_NAME: string;
}

const HTML = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Producción inteligente</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    <style>
      body { font-family: system-ui, sans-serif; padding: 1rem; max-width: 720px; margin: auto; }
      fieldset { margin-bottom: 1rem; padding: 1rem; }
      label { display: block; margin-bottom: 0.5rem; }
      input { width: 100%; padding: 0.5rem; margin-top: 0.25rem; }
      button { padding: 0.75rem 1rem; margin-top: 0.5rem; }
      pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; }
      #message { margin-top: 1rem; color: #0f172a; }
    </style>
  </head>
  <body>
    <h1>Producción inteligente</h1>
    <p>Bienvenido a la PWA de producción inteligente con Cloudflare Workers, D1 y R2.</p>

    <fieldset>
      <legend>Producción estimada</legend>
      <form id="search-form" style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:flex-end; margin-bottom:1rem;">
        <label style="flex:1; min-width:220px;">
          Buscar producción
          <input id="search-query" placeholder="Producto o valor" style="width:100%;" />
        </label>
        <button type="submit">Buscar</button>
        <button type="button" id="clear-search">Mostrar todos</button>
      </form>
      <button id="load-records">Cargar producción</button>
      <table id="records-table" style="width:100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
          <tr>
            <th style="text-align:left; padding: 0.5rem; border-bottom: 1px solid #d1d5db;">ID</th>
            <th style="text-align:left; padding: 0.5rem; border-bottom: 1px solid #d1d5db;">Nombre</th>
            <th style="text-align:left; padding: 0.5rem; border-bottom: 1px solid #d1d5db;">Valor</th>
            <th style="text-align:left; padding: 0.5rem; border-bottom: 1px solid #d1d5db;">Fecha</th>
            <th style="text-align:left; padding: 0.5rem; border-bottom: 1px solid #d1d5db;">Acciones</th>
          </tr>
        </thead>
        <tbody id="records-body"></tbody>
      </table>
      <div id="record-pagination" style="display:flex; gap:0.5rem; align-items:center; margin-top:0.75rem;">
        <button type="button" id="record-prev-page">Anterior</button>
        <span id="record-page-info">Página 1</span>
        <button type="button" id="record-next-page">Siguiente</button>
      </div>
    </fieldset>

    <fieldset>
      <legend>Agregar registro</legend>
      <form id="record-form">
        <label>
          Nombre
          <input name="name" required />
        </label>
        <label>
          Valor
          <input name="value" required />
        </label>
        <button type="submit">Agregar registro</button>
      </form>
    </fieldset>

    <fieldset>
      <legend>Eliminar registro</legend>
      <form id="delete-form">
        <label>
          ID del registro
          <input name="id" required />
        </label>
        <button type="submit">Eliminar registro</button>
      </form>
    </fieldset>

    <fieldset>
      <legend>Actualizar registro</legend>
      <form id="update-form">
        <label>
          ID del registro
          <input name="id" required />
        </label>
        <label>
          Nombre
          <input name="name" required />
        </label>
        <label>
          Valor
          <input name="value" required />
        </label>
        <button type="submit">Actualizar registro</button>
      </form>
    </fieldset>

    <fieldset>
      <legend>Ver registro</legend>
      <form id="get-record-form">
        <label>
          ID del registro
          <input name="id" required />
        </label>
        <button type="submit">Buscar registro</button>
      </form>
      <pre id="record-detail" style="background:#f3f4f6;padding:1rem;border-radius:0.5rem;margin-top:1rem;white-space:pre-wrap;"></pre>
    </fieldset>

    <fieldset>
      <legend>Assets</legend>
      <form id="asset-form">
        <label>
          Archivo
          <input id="asset-file" type="file" accept="*/*" required />
        </label>
        <label>
          Clave en R2
          <input id="asset-key" required placeholder="documento.txt" />
        </label>
        <button type="submit">Subir asset</button>
      </form>
      <form id="asset-search-form" style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:flex-end; margin-top:1rem;">
        <label style="flex:1; min-width:220px;">
          Buscar assets
          <input id="asset-search-query" placeholder="Clave o texto" style="width:100%;" />
        </label>
        <button type="submit">Buscar</button>
        <button type="button" id="clear-asset-search">Mostrar todos</button>
      </form>
      <button id="load-assets">Listar assets</button>
      <div id="assets-list" style="margin-top: 1rem;"></div>
      <div id="asset-pagination" style="display:flex; gap:0.5rem; align-items:center; margin-top:0.75rem;">
        <button type="button" id="asset-prev-page">Anterior</button>
        <span id="asset-page-info">Página 1</span>
        <button type="button" id="asset-next-page">Siguiente</button>
      </div>
    </fieldset>

    <div id="message"></div>

    <script>
      const recordsBody = document.getElementById('records-body');
      const messageEl = document.getElementById('message');

      function renderRecords(records) {
        if (!records.length) {
          recordsBody.innerHTML = '<tr><td colspan="5" style="padding: 0.75rem;">No hay registros.</td></tr>';
          return;
        }

        recordsBody.innerHTML = records
          .map(function (record) {
            return (
              '<tr>' +
              '<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">' + record.id + '</td>' +
              '<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">' + record.name + '</td>' +
              '<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">' + record.value + '</td>' +
              '<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">' + record.created_at + '</td>' +
              '<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">' +
              '<button type="button" data-id="' + record.id + '" data-name="' + record.name + '" data-value="' + record.value + '" class="edit-record" style="margin-right:0.5rem;">Editar</button>' +
              '<button type="button" data-id="' + record.id + '" class="delete-record">Eliminar</button>' +
              '</td>' +
              '</tr>'
            );
          })
          .join('');
      }

      let currentRecordPage = 1;
      const recordPageSize = 10;

      let currentRecordQuery = '';

      async function loadRecords(query = '', page = 1) {
        currentRecordQuery = query;
        currentRecordPage = page;
        const searchParam = query ? '?q=' + encodeURIComponent(query) : '';
        const pageParams = 'page=' + page + '&limit=' + recordPageSize;
        const response = await fetch('/api/produccion' + (searchParam ? searchParam + '&' : '?') + pageParams);
        const payload = await response.json();
        const records = payload.records ?? [];
        const total = payload.total ?? 0;
        renderRecords(records);
        updateRecordPagination(total);
      }

      function updateRecordPagination(total) {
        const pageCount = Math.max(1, Math.ceil(total / recordPageSize));
        document.getElementById('record-page-info').textContent = 'Página ' + currentRecordPage + ' de ' + pageCount;
        document.getElementById('record-prev-page').disabled = currentRecordPage === 1;
        document.getElementById('record-next-page').disabled = currentRecordPage >= pageCount;
      }

      async function goToRecordPage(delta) {
        const nextPage = Math.max(1, currentRecordPage + delta);
        loadRecords(currentRecordQuery, nextPage);
      }

      async function searchRecords(event) {
        event.preventDefault();
        const query = document.getElementById('search-query').value.trim();
        loadRecords(query, 1);
      }

      function clearSearch() {
        document.getElementById('search-query').value = '';
        loadRecords('', 1);
      }

      async function addRecord(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
          name: form.name.value,
          value: form.value.value,
        };

        const response = await fetch('/api/produccion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        messageEl.textContent = result.success ? 'Registro guardado.' : result.error;
        if (response.ok) {
          form.reset();
          loadRecords();
        }
      }

      async function removeRecord(event) {
        event.preventDefault();
        const form = event.target;
        const id = form.id.value;
        const response = await fetch('/api/produccion/' + encodeURIComponent(id), {
          method: 'DELETE',
        });

        const result = await response.json();
        messageEl.textContent = result.success ? 'Registro eliminado.' : result.error;
        if (response.ok) {
          form.reset();
          loadRecords();
          loadAssets();
        }
      }

      async function updateRecordHandler(event) {
        event.preventDefault();
        const form = event.target;
        const id = form.id.value;
        const data = {
          name: form.name.value,
          value: form.value.value,
        };

        const response = await fetch('/api/produccion/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        messageEl.textContent = result.success ? 'Registro actualizado.' : result.error;
        if (response.ok) {
          form.reset();
          loadRecords();
        }
      }

      async function getRecordHandler(event) {
        event.preventDefault();
        const form = event.target;
        const id = form.id.value;
        const response = await fetch('/api/produccion/' + encodeURIComponent(id));
        const detailEl = document.getElementById('record-detail');

        if (!response.ok) {
          const result = await response.json();
          detailEl.textContent = result.error || 'No se pudo obtener el registro.';
          return;
        }

        const record = await response.json();
        detailEl.textContent = JSON.stringify(record, null, 2);
      }

      async function handleRecordAction(event) {
        const button = event.target.closest('button');
        if (!button) return;

        if (button.classList.contains('edit-record')) {
          const id = button.dataset.id;
          const name = button.dataset.name;
          const value = button.dataset.value;
          const form = document.getElementById('update-form');
          form.id.value = id;
          form.name.value = name;
          form.value.value = value;
          messageEl.textContent = 'Editando registro ' + id + '.';
          return;
        }

        if (button.classList.contains('delete-record')) {
          const id = button.dataset.id;
          const response = await fetch('/api/produccion/' + encodeURIComponent(id), {
            method: 'DELETE',
          });
          const result = await response.json();
          messageEl.textContent = result.success ? 'Registro eliminado.' : result.error;
          if (response.ok) {
            loadRecords();
            loadAssets();
          }
        }
      }

      let currentAssetPage = 1;
      const assetPageSize = 10;

      let currentAssetQuery = '';

      async function loadAssets(query = '', page = 1) {
        currentAssetQuery = query;
        currentAssetPage = page;
        const searchParam = query ? '?q=' + encodeURIComponent(query) : '';
        const pageParams = 'page=' + page + '&limit=' + assetPageSize;
        const response = await fetch('/api/inventario' + (searchParam ? searchParam + '&' : '?') + pageParams);
        const assetsListEl = document.getElementById('assets-list');
        if (!response.ok) {
          const error = await response.json();
          assetsListEl.innerHTML = '<p style="color:#b91c1c">' + (error.error || 'No se pudieron cargar assets.') + '</p>';
          return;
        }

        const payload = await response.json();
        const assets = payload.assets ?? [];
        const total = payload.total ?? 0;
        if (!assets.length) {
          assetsListEl.innerHTML = '<p>No hay assets cargados.</p>';
          updateAssetPagination(total);
          return;
        }

        assetsListEl.innerHTML = '<ul style="list-style:none; padding-left:0;">' + assets
          .map(function (key) {
            return (
              '<li style="margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e5e7eb; padding-bottom:0.5rem;">' +
              '<a href="/api/inventario/' + encodeURIComponent(key) + '" target="_blank" rel="noreferrer">' + key + '</a>' +
              '<button type="button" data-key="' + key + '" class="delete-asset">Eliminar</button>' +
              '</li>'
            );
          })
          .join('') + '</ul>';
        updateAssetPagination(total);
      }

      function updateAssetPagination(total) {
        const pageCount = Math.max(1, Math.ceil(total / assetPageSize));
        document.getElementById('asset-page-info').textContent = 'Página ' + currentAssetPage + ' de ' + pageCount;
        document.getElementById('asset-prev-page').disabled = currentAssetPage === 1;
        document.getElementById('asset-next-page').disabled = currentAssetPage >= pageCount;
      }

      async function goToAssetPage(delta) {
        const nextPage = Math.max(1, currentAssetPage + delta);
        loadAssets(currentAssetQuery, nextPage);
      }

      async function searchAssets(event) {
        event.preventDefault();
        const query = document.getElementById('asset-search-query').value.trim();
        loadAssets(query, 1);
      }

      function clearAssetSearch() {
        document.getElementById('asset-search-query').value = '';
        loadAssets('', 1);
      }

      async function uploadAssetHandler(event) {
        event.preventDefault();
        const fileInput = document.getElementById('asset-file');
        const keyInput = document.getElementById('asset-key');
        const file = fileInput.files[0];
        const key = keyInput.value;

        if (!file || !key) {
          messageEl.textContent = 'Selecciona un archivo y una clave.';
          return;
        }

        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

        const response = await fetch('/api/inventario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, content: base64 }),
        });

        const result = await response.json();
        messageEl.textContent = result.success ? 'Asset subido correctamente.' : result.error;
        if (response.ok) {
          fileInput.value = '';
          keyInput.value = '';
          loadAssets();
        }
      }

      async function handleAssetAction(event) {
        const button = event.target.closest('button');
        if (!button || !button.classList.contains('delete-asset')) return;
        const key = button.dataset.key;
        const response = await fetch('/api/inventario/' + encodeURIComponent(key), {
          method: 'DELETE',
        });
        const result = await response.json();
        messageEl.textContent = result.success ? 'Asset eliminado.' : result.error;
        if (response.ok) {
          loadAssets();
        }
      }

      document.getElementById('load-records').addEventListener('click', () => loadRecords());
      document.getElementById('search-form').addEventListener('submit', searchRecords);
      document.getElementById('clear-search').addEventListener('click', clearSearch);
      document.getElementById('record-form').addEventListener('submit', addRecord);
      document.getElementById('delete-form').addEventListener('submit', removeRecord);
      document.getElementById('update-form').addEventListener('submit', updateRecordHandler);
      document.getElementById('get-record-form').addEventListener('submit', getRecordHandler);
      document.getElementById('asset-form').addEventListener('submit', uploadAssetHandler);
      document.getElementById('asset-search-form').addEventListener('submit', searchAssets);
      document.getElementById('clear-asset-search').addEventListener('click', clearAssetSearch);
      document.getElementById('load-assets').addEventListener('click', () => loadAssets());
      document.getElementById('record-prev-page').addEventListener('click', () => goToRecordPage(-1));
      document.getElementById('record-next-page').addEventListener('click', () => goToRecordPage(1));
      document.getElementById('asset-prev-page').addEventListener('click', () => goToAssetPage(-1));
      document.getElementById('asset-next-page').addEventListener('click', () => goToAssetPage(1));
      document.getElementById('records-body').addEventListener('click', handleRecordAction);
      document.getElementById('assets-list').addEventListener('click', handleAssetAction);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }

      loadRecords();
      loadAssets();
    </script>
  </body>
</html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', project: env.PROJECT_NAME }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/manifest.webmanifest') {
      return new Response(MANIFEST, { headers: { 'Content-Type': 'application/manifest+json' } });
    }

    if (pathname === '/sw.js') {
      return new Response(SERVICE_WORKER, {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    if (pathname === '/icon.svg') {
      return new Response(ICON_SVG, { headers: { 'Content-Type': 'image/svg+xml' } });
    }

    if (pathname === '/api/dashboard' && request.method === 'GET') {
      const payload = {
        productionToday: 0,
        wastePercent: 0,
        inventory: 0,
        forecast: 0,
        weeklyProduction: [120, 135, 128, 142, 150, 161, 147],
        stores: [
          { name: 'Tienda 1', status: 'ok' },
          { name: 'Tienda 2', status: 'ok' },
        ],
      };

      return new Response(JSON.stringify(payload, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/records') {
      if (request.method === 'GET') {
        await initializeDb(env.DB);
        const query = url.searchParams.get('q') ?? undefined;
        const page = Number(url.searchParams.get('page') ?? '1');
        const limit = Number(url.searchParams.get('limit') ?? '10');
        const { records, total } = await getRecords(env.DB, query, page, limit);
        return new Response(JSON.stringify({ records, total }, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'POST') {
        const body = (await request.json()) as { name?: unknown; value?: unknown };
        const name = body.name;
        const value = body.value;

        if (typeof name !== 'string' || typeof value !== 'string' || !name || !value) {
          return new Response(JSON.stringify({ error: 'Missing name or value' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        await initializeDb(env.DB);
        await addRecord(env.DB, name, value);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(null, { status: 405 });
    }

    if (pathname.startsWith('/api/records/') && request.method === 'GET') {
      const id = pathname.slice('/api/records/'.length);
      const numericId = Number(id);
      if (!id || Number.isNaN(numericId)) {
        return new Response(JSON.stringify({ error: 'Invalid record id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await initializeDb(env.DB);
      const record = await getRecordById(env.DB, numericId);
      if (!record) {
        return new Response(JSON.stringify({ error: 'Record not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(record, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname.startsWith('/api/records/') && request.method === 'DELETE') {
      const id = pathname.slice('/api/records/'.length);
      const numericId = Number(id);
      if (!id || Number.isNaN(numericId)) {
        return new Response(JSON.stringify({ error: 'Invalid record id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await initializeIfNeeded(env.DB);
      await deleteRecord(env.DB, numericId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname.startsWith('/api/records/') && request.method === 'PUT') {
      const id = pathname.slice('/api/records/'.length);
      const numericId = Number(id);
      if (!id || Number.isNaN(numericId)) {
        return new Response(JSON.stringify({ error: 'Invalid record id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = (await request.json()) as { name?: unknown; value?: unknown };
      const name = body.name;
      const value = body.value;
      if (typeof name !== 'string' || typeof value !== 'string' || !name || !value) {
        return new Response(JSON.stringify({ error: 'Missing name or value' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await initializeIfNeeded(env.DB);
      await updateRecord(env.DB, numericId, name, value);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/assets' && request.method === 'GET') {
      const query = url.searchParams.get('q') ?? undefined;
      const page = Number(url.searchParams.get('page') ?? '1');
      const limit = Number(url.searchParams.get('limit') ?? '10');
      const assets = await listAssets(env.ASSETS, query, page, limit);
      return new Response(JSON.stringify(assets, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/assets' && request.method === 'POST') {
      const body = (await request.json()) as { key?: unknown; content?: unknown };
      const key = body.key;
      const content = body.content;
      if (typeof key !== 'string' || typeof content !== 'string' || !key || !content) {
        return new Response(JSON.stringify({ error: 'Missing key or content' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      await uploadAsset(env.ASSETS, key, bytes);
      return new Response(JSON.stringify({ success: true, key }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname.startsWith('/api/assets/')) {
      const key = pathname.slice('/api/assets/'.length);
      if (request.method === 'DELETE') {
        await deleteAsset(env.ASSETS, key);
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const assetResponse = await getAsset(env.ASSETS, key);
      return (
        assetResponse ??
        new Response(JSON.stringify({ error: 'Asset not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    if (pathname === '/assets/ui-entry.js') {
      return new Response(`import '/assets/ui-app.js';`, {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    if (
      pathname === '/' ||
      pathname === '/dashboard' ||
      pathname === '/production' ||
      pathname === '/inventory' ||
      pathname === '/configuration'
    ) {
      return new Response(renderAppToHtml(pathname), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  },
};

async function initializeIfNeeded(db: D1Database) {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value TEXT, created_at TEXT)`,
  );
}
