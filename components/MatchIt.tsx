import React, { useState, useEffect, useCallback } from 'react';
import { User, Group, ReportCategory, MatchItInteraction, MatchPerson, MatchItLocationShare } from '../types';
import { Flame, MapPin, AlertTriangle, ShieldOff, Flag, XCircle, Loader2, MessageSquare, Sparkles, MessageCircle, Leaf, LayoutGrid, List, Map, CircleHelp, ChevronDown } from 'lucide-react';
import VibeTapModal from './VibeTapModal';
import MatchItPeopleMap, { sharesToMapPins, MapPin as MatchMapPin } from './MatchItPeopleMap';
import { api } from '../services/supabaseClient';

/** Stable ids stored in DB; labels are what users see. */
const LOOKING_FOR_OPTIONS = [
  {
    id: 'match',
    label: 'Match',
    blurb: 'We both bring. Each of you shows up with your own tree and smoke together.',
    aliases: ['Match to smoke', 'Looking for new friends', 'We both bring'],
  },
  {
    id: 'burn_one',
    label: 'Burn one',
    blurb: 'Down to spark up now. Looking for a sesh sooner rather than later.',
    aliases: ['Burn it'],
  },
  {
    id: 'smoke_me_out',
    label: 'Smoke me out',
    blurb: 'Hoping someone brings the flower and treats you to a smoke.',
    aliases: [] as string[],
  },
  {
    id: 'smoke_you_out',
    label: 'Smoke you out',
    blurb: "I got the tree — I'll smoke you out. You're treating.",
    aliases: ['I got the tree', "I'll smoke you out", 'Ill smoke you out'],
  },
  {
    id: 'pack_pass',
    label: 'Pack & pass',
    blurb: 'Share a bowl, blunt, or joint — pack it, pass it, maybe try a strain together.',
    aliases: ['Looking for people to try strain with', 'Try a strain'],
  },
  {
    id: 'sesh_later',
    label: 'Sesh later',
    blurb: 'Not free this second, but want to plan a smoke sesh later today.',
    aliases: ['Sesh later today'],
  },
] as const;

type LookingForId = (typeof LOOKING_FOR_OPTIONS)[number]['id'];

const LOOKING_FOR_IDS = LOOKING_FOR_OPTIONS.map(o => o.id) as LookingForId[];

const lookingForLabel = (id: LookingForId): string =>
  LOOKING_FOR_OPTIONS.find(o => o.id === id)?.label ?? id;

const resolveLookingForToken = (token: string): LookingForId | null => {
  const t = token.trim();
  if (!t) return null;
  const byId = LOOKING_FOR_OPTIONS.find(o => o.id === t);
  if (byId) return byId.id;
  const byLabel = LOOKING_FOR_OPTIONS.find(
    o => o.label.toLowerCase() === t.toLowerCase() || o.aliases.some(a => a.toLowerCase() === t.toLowerCase())
  );
  return byLabel?.id ?? null;
};

const VIEW_MODE_KEY = 'matchit-nearby-view';
const FILTER_KEY = 'matchit-intent-filters';
const FILTER_OPEN_KEY = 'matchit-filter-open';

/** Parse stored looking-for (JSON ids/labels or legacy single string). Empty = nothing selected. */
export const parseLookingFor = (raw?: string | null): LookingForId[] => {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();
  const collect = (tokens: string[]): LookingForId[] => {
    const seen = new Set<LookingForId>();
    for (const token of tokens) {
      const id = resolveLookingForToken(token);
      if (id) seen.add(id);
    }
    return [...seen];
  };

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return collect(parsed.filter((v): v is string => typeof v === 'string'));
      }
    } catch {
      /* fall through */
    }
  }

  const single = resolveLookingForToken(trimmed);
  if (single) return [single];

  return collect(trimmed.split(','));
};

export const serializeLookingFor = (values: LookingForId[]): string =>
  values.length ? JSON.stringify(values) : '';

const personMatchesFilters = (person: MatchPerson, filters: LookingForId[]): boolean => {
  if (filters.length === 0) return true;
  const intents = parseLookingFor(person.matchLookingFor);
  return filters.some(f => intents.includes(f));
};

const distanceLabel = (person: MatchPerson) =>
  person.distance != null
    ? person.distance < 1
      ? `${Math.round(person.distance * 1000)}m`
      : `${person.distance.toFixed(1)} km`
    : person.city || 'Nearby';

const LookingForDisplay: React.FC<{ raw?: string; className?: string; compact?: boolean }> = ({
  raw,
  className = '',
  compact = false,
}) => {
  if (!raw) return null;
  const intents = parseLookingFor(raw);
  const labels = intents.map(lookingForLabel);
  if (compact) {
    return (
      <p className={`text-xs font-semibold truncate flex items-center gap-1 ${className}`}>
        <Flame size={12} className="flex-shrink-0" />
        {labels.join(' · ')}
      </p>
    );
  }
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {intents.map(id => (
        <span
          key={id}
          title={LOOKING_FOR_OPTIONS.find(o => o.id === id)?.blurb}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/90 text-white"
        >
          <Flame size={10} /> {lookingForLabel(id)}
        </span>
      ))}
    </div>
  );
};

const IntentGlossaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
    aria-labelledby="intent-glossary-title"
  >
    <div
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] w-full max-w-md shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h2 id="intent-glossary-title" className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
          <Flame size={18} className="text-orange-500" /> Smoke intents
        </h2>
        <button type="button" onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full" aria-label="Close">
          <XCircle size={20} />
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto">
        <p className="text-sm text-[var(--text-muted)]">
          Pick what you&apos;re down for so people nearby know the vibe. Use <span className="font-semibold text-[var(--text-main)]">Filter nearby</span> to only see people with matching intents.
        </p>
        <ul className="space-y-3">
          {LOOKING_FOR_OPTIONS.map(opt => (
            <li key={opt.id} className="flex gap-3 items-start">
              <span className="mt-0.5 inline-flex flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">
                {opt.label}
              </span>
              <p className="text-sm text-[var(--text-main)] leading-snug pt-0.5">{opt.blurb}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);

const ReportModal: React.FC<{
  person: MatchPerson;
  onClose: () => void;
  onReport: (reportedUserId: string, category: ReportCategory, reason: string) => void;
}> = ({ person, onClose, onReport }) => {
  const categories: ReportCategory[] = ['Suspicious activity', 'Underage', 'Spam', 'Harassment', 'Drugs for sale', 'Fake / catfishing'];
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) return;
    setIsSubmitting(true);
    await onReport(person.id, selectedCategory, reason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] w-full max-w-md flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-red-500 flex items-center gap-2"><Flag size={18} /> Report {person.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><XCircle size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--text-muted)]">Select a reason for reporting this person. Moderators will review it.</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`p-2 text-sm text-left rounded-xl border transition-colors ${selectedCategory === cat ? 'bg-red-500/15 border-red-500 text-red-700' : 'border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>
                {cat}
              </button>
            ))}
          </div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Additional details (optional)" className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-2 text-sm h-20 resize-none focus:outline-none focus:border-[var(--accent)]" />
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-end">
          <button onClick={handleSubmit} disabled={!selectedCategory || isSubmitting} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MatchSuccessModal: React.FC<{
  info: { group: Group; otherUser: { name: string; avatar: string } };
  onClose: () => void;
  onGoToSesh: (groupId: string) => void;
}> = ({ info, onClose, onGoToSesh }) => (
  <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] w-full max-w-sm flex flex-col items-center text-center p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
      <Sparkles size={48} className="text-orange-500 mb-4 animate-pulse" />
      <h2 className="text-2xl font-extrabold text-[var(--text-main)]">The vibes connected!</h2>
      <p className="text-[var(--text-muted)] mt-2">You and {info.otherUser.name} sparked a Sesh. You can now chat privately.</p>
      <div className="my-6">
        <img src={info.otherUser.avatar} className="w-24 h-24 rounded-full border-4 border-orange-400 shadow-lg object-cover" alt={info.otherUser.name} />
      </div>
      <button onClick={() => onGoToSesh(info.group.id)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-full">
        Go to Sesh
      </button>
      <button onClick={onClose} className="mt-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]">
        Keep browsing
      </button>
    </div>
  </div>
);

/** Grindr-style photo tile — vibe first, no open chat until matched */
const PersonCard: React.FC<{
  person: MatchPerson;
  alreadySent: boolean;
  onVibe: () => void;
  onReport: () => void;
  onBlock: () => void;
}> = ({ person, alreadySent, onVibe, onReport, onBlock }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--shadow-card)] group">
      <img src={person.avatar} alt={person.name} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
          <MapPin size={12} /> {distanceLabel(person)}
        </span>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm"
            aria-label="More options"
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
              <button onClick={() => { onReport(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)] text-red-500">
                <Flag size={14} /> Report
              </button>
              <button onClick={() => { onBlock(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)]">
                <ShieldOff size={14} /> Block
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <h3 className="font-extrabold text-lg leading-tight truncate">{person.name}</h3>
        <LookingForDisplay raw={person.matchLookingFor} className="mt-1" />
        {person.smokingStyle && (
          <p className="text-[11px] text-white/70 mt-0.5 flex items-center gap-1">
            <Leaf size={11} /> Prefers {person.smokingStyle}
          </p>
        )}
        <button
          onClick={onVibe}
          disabled={alreadySent}
          className="mt-3 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold py-2 rounded-full flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquare size={14} />
          {alreadySent ? 'Vibe sent' : 'Send Vibe'}
        </button>
      </div>
    </div>
  );
};

const PersonListRow: React.FC<{
  person: MatchPerson;
  alreadySent: boolean;
  onVibe: () => void;
  onReport: () => void;
  onBlock: () => void;
}> = ({ person, alreadySent, onVibe, onReport, onBlock }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.35rem] shadow-[var(--shadow-card)]">
      <img
        src={person.avatar}
        alt={person.name}
        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-[var(--border)]"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-[var(--text-main)] truncate">{person.name}</h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)]">
            <MapPin size={11} /> {distanceLabel(person)}
          </span>
        </div>
        <LookingForDisplay raw={person.matchLookingFor} className="mt-1 text-orange-600" compact />
        {person.smokingStyle && (
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1 truncate">
            <Leaf size={11} /> Prefers {person.smokingStyle}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0 relative">
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          className="w-8 h-8 rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover)] flex items-center justify-center"
          aria-label="More options"
        >
          ···
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 w-36 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
            <button onClick={() => { onReport(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)] text-red-500">
              <Flag size={14} /> Report
            </button>
            <button onClick={() => { onBlock(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)]">
              <ShieldOff size={14} /> Block
            </button>
          </div>
        )}
        <button
          onClick={onVibe}
          disabled={alreadySent}
          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold rounded-full flex items-center gap-1.5"
        >
          <MessageSquare size={13} />
          {alreadySent ? 'Sent' : 'Vibe'}
        </button>
      </div>
    </div>
  );
};

const MatchIt: React.FC<{
  user: User;
  userAge: number | null;
  onReportUser: (reportedUserId: string, category: ReportCategory, reason: string) => Promise<void>;
  onBlockUser: (blockedId: string) => Promise<void>;
  onMatch: (groupId: string) => void;
  groups?: Group[];
  onSelectGroup?: (groupId: string) => void;
  refreshUser: () => Promise<void>;
  refreshGroups?: () => Promise<void> | void;
}> = ({ user, userAge, onReportUser, onBlockUser, onMatch, groups, onSelectGroup, refreshUser, refreshGroups }) => {
  const [people, setPeople] = useState<MatchPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FIND' | 'CHATS'>('FIND');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>(() => {
    if (typeof window === 'undefined') return 'grid';
    const saved = window.localStorage.getItem(VIEW_MODE_KEY);
    if (saved === 'list' || saved === 'map') return saved;
    return 'grid';
  });
  const [locationShares, setLocationShares] = useState<MatchItLocationShare[]>([]);
  const [selectedMapPin, setSelectedMapPin] = useState<MatchMapPin | null>(null);
  const [showInMatchIt, setShowInMatchIt] = useState(Boolean(user.showInMatchIt));
  const [lookingFor, setLookingFor] = useState<LookingForId[]>(() => parseLookingFor(user.matchLookingFor));
  const [intentFilters, setIntentFilters] = useState<LookingForId[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem(FILTER_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((v): v is LookingForId => LOOKING_FOR_IDS.includes(v));
    } catch {
      return [];
    }
  });
  const [filterOpen, setFilterOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(FILTER_OPEN_KEY) === '1';
  });
  const [presenceSaving, setPresenceSaving] = useState(false);
  const [tappingPerson, setTappingPerson] = useState<MatchPerson | null>(null);
  const [showIntentGlossary, setShowIntentGlossary] = useState(false);
  const [reportingPerson, setReportingPerson] = useState<MatchPerson | null>(null);
  const [matchSuccessInfo, setMatchSuccessInfo] = useState<{ group: Group; otherUser: { name: string; avatar: string } } | null>(null);
  const [interactions, setInteractions] = useState<MatchItInteraction[]>([]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(FILTER_KEY, JSON.stringify(intentFilters));
  }, [intentFilters]);

  useEffect(() => {
    window.localStorage.setItem(FILTER_OPEN_KEY, filterOpen ? '1' : '0');
  }, [filterOpen]);

  const loadFeed = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);
    setLoadError(null);
    try {
      const [nearby, vibes, shares] = await Promise.all([
        api.getMatchItPeople(user),
        api.getMatchItInteractionsForUser(user.id),
        api.getMatchItLocationShares(user.id),
      ]);
      setPeople(nearby);
      setInteractions(vibes);
      setLocationShares(shares);
    } catch (e: any) {
      console.error('MatchIt feed failed:', e);
      setLoadError(e?.message || 'Could not load people nearby. Try again.');
      if (!opts?.silent) {
        setPeople([]);
        setInteractions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.city, user.state, user.latitude, user.longitude, user.distanceRadius]);

  useEffect(() => {
    setShowInMatchIt(Boolean(user.showInMatchIt));
    setLookingFor(parseLookingFor(user.matchLookingFor));
  }, [user.showInMatchIt, user.matchLookingFor]);

  useEffect(() => {
    if (userAge !== null && userAge >= 21 && user.city && user.state) {
      void loadFeed();
    } else {
      setIsLoading(false);
    }
  }, [userAge, user.city, user.state, loadFeed]);

  useEffect(() => {
    if (!(userAge !== null && userAge >= 21 && user.city && user.state)) return;
    const soft = () => {
      if (document.visibilityState !== 'visible') return;
      void loadFeed({ silent: true });
    };
    const onVisible = () => soft();
    document.addEventListener('visibilitychange', onVisible);
    const intervalId = window.setInterval(soft, 45 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(intervalId);
    };
  }, [userAge, user.city, user.state, loadFeed]);

  const handleTogglePresence = async () => {
    const next = !showInMatchIt;
    setShowInMatchIt(next);
    setPresenceSaving(true);
    try {
      await api.setMatchItPresence(user.id, next, serializeLookingFor(lookingFor));
      await refreshUser();
      await loadFeed();
    } catch (e: any) {
      setShowInMatchIt(!next);
      alert(e.message || 'Could not update MatchIt presence');
    } finally {
      setPresenceSaving(false);
    }
  };

  const handleLookingForToggle = async (option: LookingForId) => {
    const next = lookingFor.includes(option)
      ? lookingFor.filter(v => v !== option)
      : [...lookingFor, option];
    setLookingFor(next);
    if (!showInMatchIt) return;
    try {
      await api.setMatchItPresence(user.id, true, serializeLookingFor(next));
      await refreshUser();
    } catch (e: any) {
      setLookingFor(lookingFor);
      alert(e.message || 'Could not update status');
    }
  };

  const handleFilterToggle = (option: LookingForId) => {
    setIntentFilters(prev =>
      prev.includes(option) ? prev.filter(v => v !== option) : [...prev, option]
    );
  };

  const handleSendVibe = async (message: string, type: 'TAP' | 'SPARK') => {
    if (!tappingPerson) return;
    try {
      const { interaction, mutualMatch } = await api.sendVibe(user.id, tappingPerson.id, message, type);
      setTappingPerson(null);
      if (mutualMatch) {
        setMatchSuccessInfo({ group: mutualMatch, otherUser: { name: tappingPerson.name, avatar: tappingPerson.avatar } });
        void refreshGroups?.();
      } else if (interaction) {
        setInteractions(prev => [interaction, ...prev.filter(i => i.id !== interaction.id)]);
      }
    } catch (e: any) {
      alert(e.message);
      setTappingPerson(null);
    }
  };

  const handleRespondVibe = async (interaction: MatchItInteraction, response: 'MATCHED' | 'DECLINED') => {
    try {
      const matchedGroup = await api.respondToVibe(interaction.id, interaction.sender_id, interaction.receiver_id, response);
      if (response === 'MATCHED') {
        if (!matchedGroup) {
          alert('Could not create the match chat. Please try again.');
          return;
        }
        setMatchSuccessInfo({ group: matchedGroup, otherUser: { name: interaction.sender_name, avatar: interaction.sender_avatar } });
        void refreshGroups?.();
      }
      setInteractions(prev => prev.map(i => (i.id === interaction.id ? { ...i, status: response } : i)));
    } catch (e: any) {
      alert(e?.message || 'Could not update that vibe. Please try again.');
    }
  };

  const handleBlock = async (person: MatchPerson) => {
    if (window.confirm(`Block ${person.name}? You won't see each other in MatchIt.`)) {
      await onBlockUser(person.id);
      setPeople(prev => prev.filter(p => p.id !== person.id));
    }
  };

  const sentToIds = new Set(
    interactions
      .filter(i => i.sender_id === user.id && i.status !== 'DECLINED')
      .map(i => i.receiver_id)
  );
  const incomingVibes = interactions.filter(i => i.receiver_id === user.id && i.status === 'PENDING');

  if (userAge === null) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
        <AlertTriangle size={48} className="text-yellow-500/50 mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-secondary)]">Date of birth required</h2>
        <p className="text-sm max-w-sm">Add your date of birth in My Stash so we can confirm you are 21+ for MatchIt.</p>
      </div>
    );
  }

  if (userAge < 21) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
        <AlertTriangle size={48} className="text-yellow-500/50 mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-secondary)]">Age Restricted</h2>
        <p className="text-sm">MatchIt is only available to users 21 and older.</p>
      </div>
    );
  }

  if (!user.city || !user.state) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
        <MapPin size={48} className="text-[var(--border-strong)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-secondary)]">Set Your Location</h2>
        <p className="text-sm max-w-sm">Add your city and state in My Stash so we can show people nearby who want to smoke.</p>
      </div>
    );
  }

  const presenceBar = (
    <div className="flex-shrink-0 p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-sm space-y-3 z-10">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-extrabold ${showInMatchIt ? 'text-orange-600' : 'text-[var(--text-main)]'}`}>
            Looking to smoke
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {showInMatchIt
              ? "You're visible nearby — send a vibe to talk first"
              : 'Off = invisible. Turn on to appear and see people nearby'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showInMatchIt}
          aria-label="Looking to smoke"
          disabled={presenceSaving}
          onClick={handleTogglePresence}
          className={`relative inline-flex items-center h-9 w-16 rounded-full transition-colors flex-shrink-0 border ${
            showInMatchIt
              ? 'bg-orange-500 border-orange-500'
              : 'bg-[var(--border-strong)] border-[var(--border)]'
          } ${presenceSaving ? 'opacity-60' : ''}`}
        >
          <span
            className={`inline-block h-7 w-7 rounded-full bg-white shadow transition-transform ${
              showInMatchIt ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {showInMatchIt && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                I&apos;m down for
              </p>
              <button
                type="button"
                onClick={() => setShowIntentGlossary(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-500"
                aria-label="What do these smoke intents mean?"
              >
                <CircleHelp size={13} /> What do these mean?
              </button>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Set your smoke intents">
              {LOOKING_FOR_OPTIONS.map(opt => {
                const selected = lookingFor.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    title={opt.blurb}
                    onClick={() => void handleLookingForToggle(opt.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      selected
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)] hover:border-orange-400 hover:text-[var(--text-main)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen(v => !v)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                aria-expanded={filterOpen}
                aria-controls="matchit-filter-nearby"
              >
                Filter nearby
                {intentFilters.length > 0 && (
                  <span className="normal-case tracking-normal font-semibold text-orange-600">
                    ({intentFilters.length})
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {intentFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIntentFilters([])}
                  className="text-[11px] font-semibold text-orange-600 hover:text-orange-500"
                >
                  Clear
                </button>
              )}
            </div>
            {filterOpen && (
              <div
                id="matchit-filter-nearby"
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter people by intent"
              >
                {LOOKING_FOR_OPTIONS.map(opt => {
                  const selected = intentFilters.includes(opt.id);
                  return (
                    <button
                      key={`filter-${opt.id}`}
                      type="button"
                      aria-pressed={selected}
                      title={opt.blurb}
                      onClick={() => handleFilterToggle(opt.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        selected
                          ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-main)]'
                          : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-main)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 min-w-0 truncate">
              <MapPin size={12} /> People near {user.city}, {user.state}
            </p>
            <div className="flex rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                aria-pressed={viewMode === 'grid'}
                title="Grid view"
              >
                <LayoutGrid size={14} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                aria-pressed={viewMode === 'list'}
                title="List view"
              >
                <List size={14} /> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'map' ? 'bg-orange-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                aria-pressed={viewMode === 'map'}
                title="Map — only shared locations"
              >
                <Map size={14} /> Map
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const incomingVibesBar =
    incomingVibes.length > 0 ? (
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-[var(--border)] bg-orange-500/5 space-y-2 max-h-40 overflow-y-auto">
        <h5 className="text-sm font-bold text-orange-600">Incoming vibes</h5>
        {incomingVibes.map(vibe => (
          <div key={vibe.id} className="flex items-center justify-between bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center gap-2 min-w-0">
              <img src={vibe.sender_avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{vibe.sender_name} {vibe.type === 'SPARK' && '🔥'}</p>
                <p className="text-xs text-[var(--text-muted)] italic truncate">"{vibe.message}"</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleRespondVibe(vibe, 'MATCHED')} className="px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-full">Match</button>
              <button onClick={() => handleRespondVibe(vibe, 'DECLINED')} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)]"><XCircle size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    ) : null;

  const userCoords =
    user.latitude != null && user.longitude != null
      ? { lat: user.latitude, lng: user.longitude }
      : null;

  const mapPins: MatchMapPin[] = (() => {
    const fromShares = sharesToMapPins(locationShares.filter((s) => !s.isSelf));
    if (userCoords) {
      fromShares.unshift({
        id: `self-${user.id}`,
        name: user.name || 'You',
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        isSelf: true,
      });
    }
    return fromShares;
  })();

  const filteredPeople = people.filter(person => personMatchesFilters(person, intentFilters));

  const renderPeople = () => {
    if (viewMode === 'map') {
      return (
        <div className="relative h-[min(70vh,560px)] min-h-[320px] mx-3 mb-4 rounded-[1.5rem] overflow-hidden border border-[var(--border)]">
          <MatchItPeopleMap
            pins={mapPins}
            userCoords={userCoords}
            onSelectPin={setSelectedMapPin}
            selectedPinId={selectedMapPin?.id}
            fullScreen
            emptyHint="Only you until someone shares location in a Match chat"
          />
          {selectedMapPin && !selectedMapPin.isSelf && (
            <div className="absolute bottom-14 left-3 right-3 z-30 bg-[var(--bg-card)]/95 border border-[var(--border)] rounded-2xl p-3 shadow-[var(--shadow-soft)] flex items-center gap-3">
              <img src={selectedMapPin.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{selectedMapPin.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedMapPin.expiresAt
                    ? `Sharing until ${new Date(selectedMapPin.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    : 'Sharing · Always on'}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedMapPin(null)} className="text-xs text-[var(--text-muted)]">
                Close
              </button>
            </div>
          )}
        </div>
      );
    }

    if (people.length === 0) {
      return (
        <div className="text-center py-16 text-[var(--text-muted)] px-6">
          <Flame size={40} className="mx-auto mb-3 text-orange-400/50" />
          <p className="font-bold text-lg text-[var(--text-main)]">Nobody nearby yet</p>
          <p className="text-sm mt-1">
            Stay visible — when others nearby turn on Looking to smoke, they'll show up here. Send a vibe to start talking.
          </p>
        </div>
      );
    }

    if (filteredPeople.length === 0) {
      return (
        <div className="text-center py-16 text-[var(--text-muted)] px-6">
          <Flame size={40} className="mx-auto mb-3 text-orange-400/50" />
          <p className="font-bold text-lg text-[var(--text-main)]">No matches for this filter</p>
          <p className="text-sm mt-1">
            Try clearing filters or picking different intents — {people.length} people are nearby.
          </p>
          <button
            type="button"
            onClick={() => setIntentFilters([])}
            className="mt-4 px-4 py-2 rounded-full text-sm font-bold bg-orange-500 text-white"
          >
            Clear filters
          </button>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="flex flex-col gap-3 p-4">
          {filteredPeople.map(person => (
            <PersonListRow
              key={person.id}
              person={person}
              alreadySent={sentToIds.has(person.id)}
              onVibe={() => setTappingPerson(person)}
              onReport={() => setReportingPerson(person)}
              onBlock={() => handleBlock(person)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
        {filteredPeople.map(person => (
          <PersonCard
            key={person.id}
            person={person}
            alreadySent={sentToIds.has(person.id)}
            onVibe={() => setTappingPerson(person)}
            onReport={() => setReportingPerson(person)}
            onBlock={() => handleBlock(person)}
          />
        ))}
      </div>
    );
  };

  const renderFeed = () => (
    <div className="flex flex-col h-full min-h-0 overflow-hidden animate-in fade-in">
      {tappingPerson && (
        <VibeTapModal userName={tappingPerson.name} onClose={() => setTappingPerson(null)} onSend={handleSendVibe} />
      )}
      {showIntentGlossary && <IntentGlossaryModal onClose={() => setShowIntentGlossary(false)} />}
      {matchSuccessInfo && (
        <MatchSuccessModal info={matchSuccessInfo} onClose={() => setMatchSuccessInfo(null)} onGoToSesh={onMatch} />
      )}
      {reportingPerson && (
        <ReportModal
          person={reportingPerson}
          onClose={() => setReportingPerson(null)}
          onReport={onReportUser}
        />
      )}

      {presenceBar}
      {showInMatchIt && incomingVibesBar}

      <div className="relative flex-1 min-h-0 overflow-y-auto sv-scroll-pad">
        {!showInMatchIt ? (
          <div className="relative min-h-full overflow-hidden">
            <div
              className="grid grid-cols-2 gap-3 p-4 pointer-events-none select-none"
              aria-hidden="true"
              style={{ filter: 'blur(14px)', transform: 'scale(1.04)' }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-[1.5rem] bg-gradient-to-b from-[var(--bg-input)] to-[var(--border)] border border-[var(--border)] overflow-hidden relative"
                >
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_35%,#fff_0%,transparent_55%)]" />
                  <div className="absolute bottom-3 left-3 right-3 space-y-2">
                    <div className="h-3 w-2/3 rounded-full bg-white/50" />
                    <div className="h-2 w-1/2 rounded-full bg-white/35" />
                    <div className="h-8 w-full rounded-full bg-orange-400/40" />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-[var(--bg-main)]/55 backdrop-blur-[2px]">
              <div className="w-full max-w-sm text-center bg-[var(--bg-card)]/95 border border-[var(--border)] rounded-[1.5rem] shadow-[var(--shadow-soft)] p-6">
                <Flame size={36} className="mx-auto mb-3 text-orange-500" />
                <h3 className="text-lg font-extrabold text-[var(--text-main)]">You're invisible</h3>
                <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                  Nearby is blanked out while Looking to smoke is off — turn it on to appear for others and see who's looking.
                </p>
                <button
                  type="button"
                  disabled={presenceSaving}
                  onClick={handleTogglePresence}
                  className="mt-5 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2"
                >
                  {presenceSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Turn on Looking to smoke
                </button>
                <p className="text-[11px] text-[var(--text-muted)] mt-3">
                  Your Matches chats stay available anytime.
                </p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 p-4">
            <Loader2 size={32} className="animate-spin text-orange-500" />
            <p className="text-sm text-[var(--text-muted)]">Finding people nearby…</p>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="mx-4 mt-4 bg-[var(--bg-card)] border border-red-300 text-red-700 rounded-2xl p-3 text-sm shadow-[var(--shadow-card)] flex items-start justify-between gap-3">
                <p className="min-w-0">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadFeed()}
                  className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-red-600 text-white"
                >
                  Retry
                </button>
              </div>
            )}
            {renderPeople()}
          </>
        )}
      </div>
    </div>
  );

  const renderChats = () => {
    const myMatches = (groups || []).filter(g => g.type === 'MATCH' && g.members.includes(user.id));
    return (
      <div className="p-4 space-y-3 sv-scroll-pad animate-in fade-in">
        {myMatches.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <Flame size={48} className="mx-auto mb-4 opacity-50 text-orange-400" />
            <p className="font-bold text-lg">No matches yet</p>
            <p className="text-sm">Send vibes to people nearby to spark a sesh — chat unlocks after you match.</p>
          </div>
        ) : (
          myMatches.map(group => {
            const otherUserId = group.members.find(id => id !== user.id);
            return (
              <div key={group.id} onClick={() => onSelectGroup?.(group.id)} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.35rem] p-4 cursor-pointer hover:shadow-[var(--shadow-card)] hover:border-orange-400 transition-all flex items-center gap-4 group">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} className="w-14 h-14 rounded-full border-2 border-[var(--border)] group-hover:border-orange-400 object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg truncate group-hover:text-orange-500 transition-colors">
                    {group.name.replace(user.name, '').replace('&', '').replace("'s Sesh", '').trim() || group.name}
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] truncate">Open chat</p>
                </div>
                <MessageCircle className="text-[var(--text-muted)] group-hover:text-orange-500" />
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-shrink-0 flex border-b border-[var(--border)] bg-[var(--bg-card)]">
        <button
          onClick={() => setActiveTab('FIND')}
          className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'FIND' ? 'border-orange-500 text-orange-500' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          <Sparkles size={16} /> Nearby
        </button>
        <button
          onClick={() => setActiveTab('CHATS')}
          className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'CHATS' ? 'border-orange-500 text-orange-500' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          <MessageCircle size={16} /> Matches
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'FIND' ? renderFeed() : (
          <div className="h-full overflow-y-auto">{renderChats()}</div>
        )}
      </div>
    </div>
  );
};

export default MatchIt;
