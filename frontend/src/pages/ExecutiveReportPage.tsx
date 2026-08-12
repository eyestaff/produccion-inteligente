import { useState } from 'react';
import { Printer, Download, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ExecutiveReportPage() {
  const navigate = useNavigate();
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-report-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Action Bar Header */}
      <div
        className="card flex-between"
        style={{
          padding: '1rem 1.5rem',
          background: 'var(--panel-solid)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/reports')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
            }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>
              Documento Oficial
            </p>
            <h2 style={{ margin: '0.1rem 0 0', fontSize: '1.25rem' }}>Resumen Ejecutivo</h2>
          </div>
        </div>

        <div className="flex-end" style={{ gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPdfModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Eye size={16} /> Vista Previa PDF
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={16} /> Imprimir
          </button>

          <a
            href="/Manual_Usuario_v1.0.pdf"
            download="Resumen_Ejecutivo_Produccion_Inteligente.pdf"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
            }}
          >
            <Download size={16} /> Descargar PDF
          </a>
        </div>
      </div>

      {/* Embedded Document Viewer Container (Fits cleanly in viewport) */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          height: 'calc(100vh - 220px)',
          minHeight: '600px',
          background: '#525659',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <iframe
          id="pdf-report-iframe"
          src="/Manual_Usuario_v1.0.pdf#zoom=72&pagemode=none"
          title="Resumen Ejecutivo PDF"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>

      {/* PDF Modal (for full-screen zoom or overlay) */}
      {showPdfModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setShowPdfModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '92vw',
              maxWidth: '1200px',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>
                  Documento Completo - Resumen Ejecutivo
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Visualizador interactivo de documento
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1rem',
                  }}
                >
                  <Printer size={16} /> Imprimir
                </button>
                <a
                  href="/Manual_Usuario_v1.0.pdf"
                  download="Resumen_Ejecutivo_Produccion_Inteligente.pdf"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1rem',
                    textDecoration: 'none',
                  }}
                >
                  <Download size={16} /> Descargar PDF
                </a>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: '#525659' }}>
              <iframe
                src="/Manual_Usuario_v1.0.pdf#zoom=72&pagemode=none"
                title="Visualizador PDF Completo"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
