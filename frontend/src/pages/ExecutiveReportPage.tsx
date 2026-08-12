import { FileText, Download, Mail } from 'lucide-react';

export function ExecutiveReportPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: 'var(--muted)',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Reporte interno
          </p>

          <h1 style={{ margin: '0.4rem 0 0' }}>
            Resumen Ejecutivo
          </h1>

          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
            Producción Inteligente
          </p>
        </div>

        <FileText size={28} />
      </div>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2>Resumen ejecutivo</h2>
        <p>
          Producción Inteligente es una plataforma SaaS orientada a mejorar la
          planificación, control y trazabilidad de las operaciones productivas.
          Su propósito es ayudar a las empresas a producir mejor, reducir
          desperdicios y tomar decisiones operativas basadas en información.
        </p>
        <p>
          La solución integra procesos de forecast, producción, inventario,
          compras, recetas, productos y gestión de mermas dentro de una misma
          plataforma.
        </p>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2>Objetivo del proyecto</h2>
        <p>
          Construir una herramienta SaaS que permita a empresas con operaciones
          productivas planificar su producción, controlar inventarios,
          gestionar mermas y mejorar la trazabilidad de sus operaciones.
        </p>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2>Clientes potenciales</h2>
        <ul>
          <li>Panaderías y pastelerías.</li>
          <li>Cadenas de tiendas con producción centralizada.</li>
          <li>Empresas de alimentación y restauración.</li>
          <li>Negocios con producción recurrente y múltiples puntos de venta.</li>
          <li>Empresas que necesitan controlar inventario, producción y merma.</li>
        </ul>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2>Propuesta de valor</h2>
        <p>
          La promesa básica de Producción Inteligente es convertir los datos
          operativos en decisiones concretas de producción, ayudando a producir
          lo necesario, controlar el inventario y reducir las pérdidas.
        </p>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2>Beneficios esperados</h2>
        <ul>
          <li>Mejor planificación de la producción.</li>
          <li>Mayor control del inventario.</li>
          <li>Reducción y trazabilidad de las mermas.</li>
          <li>Mayor visibilidad de la operación.</li>
          <li>Centralización de la información operativa.</li>
          <li>Base para decisiones apoyadas por IA.</li>
        </ul>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2>Situación actual del desarrollo</h2>
        <p>
          El proyecto cuenta actualmente con una arquitectura SaaS funcional
          basada en React, Cloudflare Workers y D1, con autenticación,
          multiempresa y módulos operativos principales implementados.
        </p>

        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          <strong>Avance estimado del producto: MVP funcional en desarrollo</strong>
          <p
            style={{
              margin: '0.4rem 0 0',
              color: 'var(--muted)',
            }}
          >
            El porcentaje global debe actualizarse conforme se incorporen y
            validen nuevos módulos.
          </p>
        </div>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2>Próximos pasos</h2>
        <ol>
          <li>Completar el módulo de reportes ejecutivos.</li>
          <li>Incorporar exportación del reporte a PDF.</li>
          <li>Incorporar envío del reporte por correo mediante Brevo.</li>
          <li>Continuar validando los módulos operativos.</li>
          <li>Preparar la solución para pilotos con clientes.</li>
        </ol>
      </section>

      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
        }}
      >
        <button
          type="button"
          className="btn-primary no-print"
          onClick={() => window.print()}
        >
          <Download size={16} />
          Exportar PDF
        </button>

        <button type="button" className="btn-primary" disabled>
          <Mail size={16} />
          Enviar por correo
        </button>
      </div>
    </div>
  );
}
