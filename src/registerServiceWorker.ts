import { withBase } from './url';

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(withBase('sw.js'), { scope: withBase('') }).catch(() => undefined);
  });
}
