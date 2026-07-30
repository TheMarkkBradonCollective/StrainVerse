import React, { useState, useEffect, useRef } from 'react';
import { Group, User, MatchItLocationShare } from '../types';
import { api } from '../services/supabaseClient';
import { Phone, Send, MapPin, Loader2, Clock, X } from 'lucide-react';

const LOCATION_DURATIONS: { label: string; minutes: number | null }[] = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: '24 hours', minutes: 1440 },
  { label: 'Always on', minutes: null },
];

const SocialSeshView: React.FC<{
  group: Group;
  user: User;
  onSendMessage: (text: string) => void;
}> = ({ group, user, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [myShare, setMyShare] = useState<MatchItLocationShare | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMatchChat = group.type === 'MATCH';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [group.messages]);

  useEffect(() => {
    if (!isMatchChat) return;
    let cancelled = false;
    const load = async () => {
      const share = await api.getMyLocationShareForGroup(user.id, group.id);
      if (!cancelled) setMyShare(share);
    };
    void load();
    const interval = window.setInterval(load, 45 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isMatchChat, user.id, group.id]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };

  const requestCoords = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported on this device.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(err.message || 'Could not get your location.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });

  const handleShareLocation = async (minutes: number | null) => {
    setShareBusy(true);
    try {
      const { lat, lng } = await requestCoords();
      const share = await api.shareMatchItLocation(user.id, group.id, lat, lng, minutes);
      setMyShare(share);
      setShowShareSheet(false);
      const label =
        minutes == null
          ? 'always on'
          : LOCATION_DURATIONS.find((d) => d.minutes === minutes)?.label || `${minutes} min`;
      onSendMessage(`📍 Shared my location (${label}) — check the MatchIt Map tab`);
    } catch (e: any) {
      alert(e?.message || 'Could not share location');
    } finally {
      setShareBusy(false);
    }
  };

  const handleStopShare = async () => {
    setShareBusy(true);
    try {
      await api.stopMatchItLocationShare(user.id, group.id);
      setMyShare(null);
      setShowShareSheet(false);
      onSendMessage('📍 Stopped sharing my location');
    } catch (e: any) {
      alert(e?.message || 'Could not stop sharing');
    } finally {
      setShareBusy(false);
    }
  };

  const shareStatusLabel = myShare
    ? myShare.expiresAt
      ? `Sharing until ${new Date(myShare.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : 'Sharing · Always on'
    : null;

  return (
    <div className="h-full flex flex-col relative pb-20 lg:pb-0 ys-group-root">
      <div
        className="p-4 border-b border-[var(--border)] flex justify-between items-center ys-group-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${group.cover_image_url || ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate">{group.name}</h2>
          <p className="text-sm text-[var(--text-muted)] truncate">{group.description}</p>
          {shareStatusLabel && (
            <p className="text-[11px] text-orange-300 font-semibold mt-1 flex items-center gap-1">
              <MapPin size={11} /> {shareStatusLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isMatchChat && (
            <button
              type="button"
              onClick={() => setShowShareSheet(true)}
              className={`p-2 rounded-full transition-colors text-white ${
                myShare ? 'bg-orange-500/80 hover:bg-orange-500' : 'bg-black/30 hover:bg-black/60'
              }`}
              title="Share location"
              aria-label="Share location"
            >
              <MapPin size={18} />
            </button>
          )}
          <button
            onClick={() => setIsCallActive(true)}
            className="p-2 bg-black/30 rounded-full hover:bg-black/60 transition-colors text-white"
          >
            <Phone size={18} />
          </button>
        </div>
      </div>

      {isCallActive && (
        <div className="bg-green-500/20 border-b border-green-500/30 p-2 text-center text-sm text-green-300 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Voice/Video chat is active
          </span>
          <button className="px-3 py-1 bg-green-500 text-black text-xs font-bold rounded-full">Join</button>
          <button onClick={() => setIsCallActive(false)} className="text-xs hover:underline">
            Leave
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 ys-group-chat">
        {group.messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.userId === user.id ? 'justify-end' : ''}`}>
            {msg.userId !== user.id && (
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`}
                className="w-8 h-8 rounded-full"
                alt={msg.userName}
              />
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-2xl ys-message-bubble ${
                msg.userId === user.id
                  ? 'bg-[var(--accent)] text-white rounded-br-none'
                  : 'bg-[var(--bg-card)] text-[var(--text-main)] rounded-bl-none'
              }`}
            >
              {msg.userId !== user.id && (
                <p className="text-xs font-bold text-[var(--accent)] mb-0.5">{msg.userName}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-main)]">
        <div className="bg-[var(--bg-input)] rounded-full flex items-center px-2 border border-[var(--border-strong)]">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Send a message..."
            className="flex-1 bg-transparent p-3 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-[var(--accent)] text-white rounded-full hover:scale-110 transition-transform"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {showShareSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => !shareBusy && setShowShareSheet(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div>
                <h3 className="font-extrabold text-[var(--text-main)] flex items-center gap-2">
                  <MapPin size={18} className="text-orange-500" /> Share location
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  They only see you on the MatchIt Map while sharing is on.
                </p>
              </div>
              <button
                type="button"
                disabled={shareBusy}
                onClick={() => setShowShareSheet(false)}
                className="p-2 rounded-full hover:bg-[var(--bg-hover)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-2">
              {LOCATION_DURATIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  disabled={shareBusy}
                  onClick={() => void handleShareLocation(opt.minutes)}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-bold transition-colors disabled:opacity-60 ${
                    opt.minutes == null
                      ? 'border-orange-400 bg-orange-500/10 text-orange-700'
                      : 'border-[var(--border)] hover:border-orange-400 hover:bg-orange-500/5'
                  }`}
                >
                  <Clock size={14} />
                  {opt.label}
                </button>
              ))}
            </div>

            {myShare && (
              <div className="px-4 pb-4">
                <button
                  type="button"
                  disabled={shareBusy}
                  onClick={() => void handleStopShare()}
                  className="w-full py-3 rounded-full border border-red-300 text-red-600 font-bold text-sm hover:bg-red-50 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {shareBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                  Stop sharing
                </button>
              </div>
            )}

            {shareBusy && !myShare && (
              <div className="px-4 pb-4 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 size={16} className="animate-spin" /> Getting location…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialSeshView;
