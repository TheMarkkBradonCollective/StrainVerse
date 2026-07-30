import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { formatAppVersion } from '../utils/appVersion';

/**
 * Registers the service worker with auto-update and shows a brief
 * “Updating…” chip when a new build is applied.
 */
const PwaUpdateRefresh: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'updating' | 'ready'>('idle');

  useEffect(() => {
    let intervalId: number | undefined;
    let removeVisibility: (() => void) | undefined;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setStatus('updating');
        // Apply new assets immediately so installed PWA / APK WebView stay current.
        void updateSW(true);
      },
      onOfflineReady() {
        setStatus('ready');
        window.setTimeout(() => setStatus('idle'), 2500);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        const check = () => {
          void registration.update();
        };
        const onVisible = () => {
          if (document.visibilityState === 'visible') check();
        };
        document.addEventListener('visibilitychange', onVisible);
        removeVisibility = () => document.removeEventListener('visibilitychange', onVisible);
        intervalId = window.setInterval(check, 5 * 60 * 1000);
      },
      onRegisterError(error) {
        console.error('Service worker registration failed:', error);
      },
    });

    return () => {
      removeVisibility?.();
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  if (status === 'idle') return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[250] pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1.5 shadow-[var(--shadow-soft)] text-xs font-semibold text-[var(--text-secondary)]">
        <RefreshCw
          size={14}
          className={`text-[var(--accent)] ${status === 'updating' ? 'animate-spin' : ''}`}
        />
        {status === 'updating' ? 'Updating StrainVerse…' : `Ready · ${formatAppVersion()}`}
      </div>
    </div>
  );
};

export default PwaUpdateRefresh;
