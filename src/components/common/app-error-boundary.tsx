import { Component, type PropsWithChildren, type ReactNode } from 'react';

type ErrorBoundaryState = { hasError: boolean };

export class AppErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  render(): ReactNode {
    if (this.state.hasError) return <main className="error-page"><p className="eyebrow">Buzzerhood</p><h1>Terjadi gangguan.</h1><p>Muat ulang halaman atau kembali beberapa saat lagi.</p><button type="button" onClick={() => window.location.reload()}>Muat ulang</button></main>;
    return this.props.children;
  }
}
