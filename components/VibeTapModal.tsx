import React, { useState } from 'react';
import { XCircle, Send, Loader2, Flame } from 'lucide-react';

interface VibeTapModalProps {
  onClose: () => void;
  onSend: (message: string, type: 'TAP' | 'SPARK') => Promise<void>;
  userName: string;
}

const VibeTapModal: React.FC<VibeTapModalProps> = ({ onClose, onSend, userName }) => {
  const vibes = ["Pass?", "Let's spark?", "Yo.", "I'm faded too", "You seem cool"];
  const [customVibe, setCustomVibe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'TAP' | 'SPARK' | 'CUSTOM' | null>(null);

  const handleSend = async (message: string, type: 'TAP' | 'SPARK', loadingKey: 'TAP' | 'SPARK' | 'CUSTOM') => {
    setIsLoading(true);
    setLoadingType(loadingKey);
    try {
        await onSend(message, type);
    } catch(e) {
        setIsLoading(false);
        setLoadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-md flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">Send a Vibe to {userName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><XCircle size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <button 
            disabled={isLoading}
            onClick={() => handleSend("Spark!", 'SPARK', 'SPARK')}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && loadingType === 'SPARK' ? <Loader2 className="animate-spin" /> : <>Hit the flame <Flame size={18} /></>}
          </button>
          <p className="text-center text-xs text-[var(--text-muted)]">
            Chat unlocks only if they flame you back too.
          </p>
          <div className="text-center text-xs text-[var(--text-muted)]">or send a quick vibe (no chat unlock)…</div>
          <div className="grid grid-cols-2 gap-2">
            {vibes.map((vibe, index) => (
              <button 
                key={vibe} 
                disabled={isLoading}
                onClick={() => handleSend(vibe, 'TAP', 'TAP')}
                className="p-3 text-sm text-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
              >
                {isLoading && loadingType === 'TAP' ? <Loader2 className="animate-spin mx-auto" size={16}/> : `"${vibe}"`}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
              type="text"
              value={customVibe}
              onChange={e => setCustomVibe(e.target.value)}
              placeholder="Or write a custom vibe..."
              disabled={isLoading}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={() => handleSend(customVibe, 'TAP', 'CUSTOM')}
              disabled={isLoading || !customVibe.trim()}
              className="absolute right-1.5 top-1.5 p-2 bg-[var(--accent)] text-white rounded-full hover:scale-110 transition-transform disabled:bg-[var(--border-strong)] disabled:scale-100"
            >
              {isLoading && loadingType === 'CUSTOM' ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VibeTapModal;