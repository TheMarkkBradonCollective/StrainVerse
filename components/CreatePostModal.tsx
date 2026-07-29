import React, { useState } from 'react';
import { PostVisibility } from '../types';
import { Send, Image as ImageIcon, XCircle, Leaf, Rocket, Plus, Flame, Clock, Users, Loader2, AlertTriangle } from 'lucide-react';

const CreatePostModal: React.FC<{
  onClose: () => void;
  onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isMatchIt?: boolean) => void;
  isLocal?: boolean;
  isMatchItPost?: boolean;
}> = ({ onClose, onPost, isLocal = false, isMatchItPost = false }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInMatchIt, setShowInMatchIt] = useState(isMatchItPost);
  
  // Generic Meta
  const [highLevel, setHighLevel] = useState(5);
  const [mood, setMood] = useState<string | null>(null);
  const [strain, setStrain] = useState('');

  // MatchIt Meta
  const lookingForOptions = [
    'Match to smoke',
    'Sesh later today',
    'Looking for new friends',
    'Looking for people to try strain with',
  ];
  const [lookingFor, setLookingFor] = useState(lookingForOptions[0]);

  const durationOptions = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '3 hours', value: 180 },
    { label: '24 hours', value: 1440 },
  ];
  const [duration, setDuration] = useState(durationOptions[2].value);

  const moods = ['🫠', '🤤', '🤪', '😂', '🤯', '😮‍💨'];

  const handlePost = async () => {
    setIsLoading(true);
    setError(null);
    const meta: any = { highLevel, soundtrack: '', mood, strain };
    if (showInMatchIt) {
        meta.lookingFor = lookingFor;
        meta.duration = duration;
    }

    try {
        const visibility = showInMatchIt || isLocal || isMatchItPost ? 'LOCAL_LOUD' : 'HIGHLINE';
        await onPost(content, visibility, image, meta, showInMatchIt);
        onClose();
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const FormLabel: React.FC<{icon: React.ElementType, text: string}> = ({ icon: Icon, text }) => (
      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
        <Icon size={14} /> {text}
      </label>
  );

  const MatchItToggle: React.FC = () => (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-colors ${
      showInMatchIt
        ? 'bg-orange-500/10 border-orange-500/40'
        : 'bg-[var(--bg-input)] border-[var(--border)]'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          showInMatchIt ? 'bg-orange-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
        }`}>
          <Flame size={16} />
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${showInMatchIt ? 'text-orange-600' : 'text-[var(--text-main)]'}`}>
            Show in MatchIt
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {showInMatchIt ? 'Visible to people nearby looking to connect' : 'Keep this post off the MatchIt feed'}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={showInMatchIt}
        aria-label="Show in MatchIt"
        onClick={() => setShowInMatchIt(prev => !prev)}
        className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors flex-shrink-0 ${
          showInMatchIt ? 'bg-orange-500' : 'bg-[var(--border-strong)]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            showInMatchIt ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const renderMatchItForm = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
        <div>
            <FormLabel icon={Users} text="I'm looking to..." />
            <select value={lookingFor} onChange={e => setLookingFor(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)] appearance-none">
                {lookingForOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
        <div>
             <FormLabel icon={Leaf} text="Strain I'm smoking (optional)" />
             <input type="text" value={strain} onChange={e => setStrain(e.target.value)} placeholder="e.g., Blue Dream" className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" />
        </div>
         <div>
            <FormLabel icon={Clock} text="Post expires in..." />
            <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)] appearance-none">
                {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    </div>
  );

  const renderHighlineForm = () => (
    <div className="p-2 space-y-3 border-t border-[var(--border)] mt-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
            <Leaf size={14} className="text-[var(--accent)]" />
            <input type="text" value={strain} onChange={e => setStrain(e.target.value)} placeholder="Strain Name (optional)" className="bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-3 py-1 text-sm w-full focus:outline-none focus:border-[var(--accent)]" />
        </div>
        <div className="flex items-center gap-2">
            <Rocket size={14} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)] w-28">Level: {highLevel}/10</span>
            <input type="range" min="0" max="10" value={highLevel} onChange={e => setHighLevel(parseInt(e.target.value))} className="w-full h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]" />
        </div>
    </div>
  );

  return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] w-full max-w-lg flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    {showInMatchIt ? <><Flame size={18} className="text-orange-500" /> Create MatchIt Post</> : 'Create a Post'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><XCircle size={20} /></button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                 <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={showInMatchIt ? "What's the vibe? e.g., 'Looking for someone to chill and listen to music with...'" : "What's sparking up?"}
                    className="w-full bg-transparent p-2 focus:outline-none resize-none text-lg placeholder:text-[var(--text-muted)]"
                    rows={showInMatchIt ? 3 : 4}
                />

                <MatchItToggle />
                
                {showInMatchIt ? renderMatchItForm() : null}
                
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {imagePreview && (
                    <div className="relative p-2 group">
                        <img src={imagePreview} className="rounded-lg max-h-60 w-auto" alt="Post preview" />
                        <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-4 right-4 bg-black/70 p-1 rounded-full text-white hover:scale-110 transition-transform">
                            <XCircle size={20} />
                        </button>
                    </div>
                )}
                 <div className="border-t border-[var(--border)] pt-3 mt-2">
                    <p className="text-xs font-bold text-[var(--text-muted)] text-center mb-2">ADD A MOOD</p>
                    <div className="flex justify-around items-center">
                        {moods.map(m => (
                            <button 
                                key={m} 
                                onClick={() => setMood(m === mood ? null : m)}
                                className={`text-3xl p-1 rounded-full transition-all duration-200 ${mood === m ? 'bg-[var(--accent-light)] scale-125' : 'hover:bg-[var(--bg-hover)] scale-100'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                {showMeta && !showInMatchIt && renderHighlineForm()}
            </div>
            <div className="flex justify-between items-center p-4 border-t border-[var(--border)]">
                <div className="flex gap-1 items-center">
                    <label htmlFor="image-upload-modal" className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer rounded-full hover:bg-[var(--accent-light)] transition-colors"><ImageIcon size={20} /></label>
                    <input id="image-upload-modal" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {!showInMatchIt && <button onClick={() => setShowMeta(!showMeta)} className={`p-2 rounded-full transition-colors ${showMeta ? 'text-[var(--accent)] bg-[var(--accent-light)]' : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]'}`}><Plus size={20} /></button>}
                </div>
                <button onClick={handlePost} disabled={!content.trim() || isLoading} className={`font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-white ${showInMatchIt ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'}`}>
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Spark It'}
                    <Send size={14} />
                </button>
            </div>
        </div>
      </div>
  )
};

export default CreatePostModal;
