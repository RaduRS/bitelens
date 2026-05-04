'use client';
import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    let reloading = false;
    const swReady = navigator.serviceWorker.register('/sw.js');

    swReady
      .then((registration) => {
        // If a waiting worker already exists when we register, kick it.
        if (registration.waiting) {
          registration.waiting.postMessage('SKIP_WAITING');
        }

        // When a new worker is installing, watch for it to become "installed"
        // (which means it's waiting because the page is controlled). Tell it
        // to skipWaiting so users pick up new code on next reload.
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage('SKIP_WAITING');
            }
          });
        });

        // Poll for updates every 60s while the tab is open, so long-lived
        // installed PWAs notice deploys without a hard restart.
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60_000);
        // Best-effort cleanup; the page lifecycle in PWAs is fuzzy.
        window.addEventListener('beforeunload', () => clearInterval(interval));
      })
      .catch(() => {});

    // Reload exactly once when a new SW takes control, so the page picks up
    // the new bundle without the user needing to force-quit the app.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  }, []);

  return null;
}
