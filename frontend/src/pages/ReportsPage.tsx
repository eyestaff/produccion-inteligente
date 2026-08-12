import { FileText } from 'lucide-react';

export function ReportsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <p className="eyebrow">Reportes</p>
        <h1 style={{ margin: '0.25rem 0 0' }}>Centro de Reportes</h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
          Consulta, exporta y comparte información ejecutiva y operativa de
          Producción Inteligente.
        </p>
      </div>

      <div
        className="card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={24} />
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Resumen Ejecutivo
            </h2>
            <p
              style={{
                margin: '0.35rem 0 0',
                color: 'var(--muted)',
                fontSize: '0.9rem',
              }}
            >
              Situación, propuesta de valor, estado del desarrollo y próximos
              pasos.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            window.location.href = '/reports/executive';
          }}
        >
          Ver reporte
        </button>
      </div>
    </div>
  );
}
