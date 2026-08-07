import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(JSON.stringify({
      level: 'error',
      component: 'ErrorBoundary',
      error: error.message,
      stack: error.stack,
      reactInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    }));
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>😢</h1>
          <h2>Algo no ha salido como esperábamos.</h2>
          <p style={{ color: '#4b5563', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Se ha producido un error inesperado en la interfaz. Nuestro equipo ha sido notificado automáticamente.
          </p>
          <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', marginBottom: '2rem', textAlign: 'left', width: '100%', maxWidth: '600px', overflow: 'auto' }}>
            <strong>Error:</strong> {this.state.error?.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Recargar aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
