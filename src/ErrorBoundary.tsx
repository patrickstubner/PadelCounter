import { Component, type ReactNode } from 'react';
import { STORAGE_KEY } from './domain/persistence';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fatal" role="alert">
        <p>Padel Counter konnte die Anzeige nicht laden.</p>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              // Storage may be blocked; reload anyway.
            }
            window.location.reload();
          }}
        >
          Neu laden
        </button>
        <p className="fatal-note">Der gespeicherte Spielstand auf diesem Gerät wird dabei gelöscht.</p>
      </div>
    );
  }
}
