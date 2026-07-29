import React, { useEffect, useState } from 'react';
import { Download, X, Share, Monitor } from 'lucide-react';
import { LogoMark } from './Logo';
import {
  BeforeInstallPromptEvent,
  PWA_INSTALL_DISMISS_KEY,
  PWA_INSTALL_AVAILABLE_EVENT,
  getDeferredInstallPrompt,
  onInstallPromptAvailable,
  isStandaloneMode,
  isIOS,
  isAndroid,
  isChromiumDesktop,
} from '../utils/pwaInstall';

type InstallMode = 'native' | 'ios' | 'android' | 'desktop';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => getDeferredInstallPrompt()
  );
  const [visible, setVisible] = useState(false);
  const [installMode, setInstallMode] = useState<InstallMode | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === '1') {
      return;
    }

    const syncPrompt = () => {
      const prompt = getDeferredInstallPrompt();
      if (prompt) {
        setDeferredPrompt(prompt);
        setInstallMode('native');
        setVisible(true);
      }
    };

    const unsubscribe = onInstallPromptAvailable(syncPrompt);
    const onAvailable = () => syncPrompt();
    window.addEventListener(PWA_INSTALL_AVAILABLE_EVENT, onAvailable);

    const fallbackTimer = window.setTimeout(() => {
      if (isStandaloneMode() || localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === '1') return;
      if (getDeferredInstallPrompt()) {
        syncPrompt();
        return;
      }
      if (isIOS()) {
        setInstallMode('ios');
        setVisible(true);
      } else if (isAndroid()) {
        setInstallMode('android');
        setVisible(true);
      } else if (isChromiumDesktop()) {
        setInstallMode('desktop');
        setVisible(true);
      }
    }, 2000);

    return () => {
      unsubscribe();
      window.removeEventListener(PWA_INSTALL_AVAILABLE_EVENT, onAvailable);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, '1');
    setVisible(false);
  };

  const handleInstall = async () => {
    const prompt = deferredPrompt ?? getDeferredInstallPrompt();
    if (!prompt) {
      if (isIOS()) setInstallMode('ios');
      else if (isAndroid()) setInstallMode('android');
      else setInstallMode('desktop');
      return;
    }

    setIsInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        dismiss();
      }
    } catch (error) {
      console.error('PWA install failed:', error);
      if (isIOS()) setInstallMode('ios');
      else if (isAndroid()) setInstallMode('android');
      else setInstallMode('desktop');
    } finally {
      setIsInstalling(false);
    }
  };

  if (!visible || isStandaloneMode()) {
    return null;
  }

  const showNativeButton = installMode === 'native' && Boolean(deferredPrompt ?? getDeferredInstallPrompt());
  const helpText =
    installMode === 'ios'
      ? 'Tap Share, then "Add to Home Screen" for the full app experience.'
      : installMode === 'android'
        ? 'Tap the menu (⋮) in your browser, then "Install app" or "Add to Home screen".'
        : installMode === 'desktop'
          ? 'Click the install icon in the address bar, or open the browser menu (⋮) and choose "Install StrainVerse".'
          : 'Add to your home screen for faster access and an app-like experience.';

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 z-50 mx-auto max-w-md fade-in-up" role="dialog" aria-label="Install StrainVerse app">
      <div
        className="rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        <div className="p-4 flex items-start gap-3">
          <LogoMark size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--text-main)] text-sm">Install StrainVerse</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {helpText}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-full flex-shrink-0 hover:bg-[var(--bg-input)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Dismiss install prompt"
          >
            <X size={18} />
          </button>
        </div>

        {showNativeButton && (
          <div className="px-4 pb-4">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              <Download size={16} />
              {isInstalling ? 'Installing...' : 'Install App'}
            </button>
          </div>
        )}

        {!showNativeButton && installMode && installMode !== 'native' && (
          <div
            className="px-4 pb-4 flex items-center gap-2 text-xs rounded-lg py-2 mx-4 mb-4"
            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            {installMode === 'ios' ? (
              <>
                <Share size={14} className="flex-shrink-0 text-sky-400" />
                <span>Share → Add to Home Screen</span>
              </>
            ) : installMode === 'android' ? (
              <>
                <Download size={14} className="flex-shrink-0 text-emerald-400" />
                <span>Menu (⋮) → Install app</span>
              </>
            ) : (
              <>
                <Monitor size={14} className="flex-shrink-0 text-emerald-400" />
                <span>Address bar install icon or Menu → Install</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
