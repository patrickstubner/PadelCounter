import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    try {
      if (!dialog.open) dialog.showModal();
    } catch {
      // The native dialog is unavailable; the buttons still work.
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="new-match-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="new-match-title">Neues Spiel?</h2>
      <p>Der Spielstand wird zurückgesetzt. Die Teamnamen bleiben erhalten.</p>
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" autoFocus onClick={onCancel}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-solid" data-testid="confirm-reset" onClick={onConfirm}>
          Zurücksetzen
        </button>
      </div>
    </dialog>
  );
}
