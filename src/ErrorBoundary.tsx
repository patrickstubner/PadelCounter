import { Component, type ReactNode } from 'react';
import { STORAGE_KEY } from './domain/persistence';
import { readLang } from './i18n/locale';
import { messages } from './i18n/messages';

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
    const text = messages[readLang()];
    return (
      <div className="fatal" role="alert">
        <p>{text.fatalTitle}</p>
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
          {text.fatalReload}
        </button>
        <p className="fatal-note">{text.fatalNote}</p>
      </div>
    );
  }
}
