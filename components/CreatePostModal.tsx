import React, { useState } from 'react';
import { PostVisibility } from '../types';
import { Send, Image as ImageIcon, XCircle, Leaf, Rocket, Plus, Loader2, AlertTriangle } from 'lucide-react';

const CreatePostModal: React.FC<{
  onClose: () => void;
  onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isMatchIt?: boolean) => void;
  isLocal?: boolean;
}> = ({ onClose, onPost, isLocal = false }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [highLevel, setHighLevel] = useState(5);
  const [mood, setMood] = useState<string | null>(null);
  const [strain, setStrain] = useState('');

  const moods = ['🫠', '🤤', '🤪', '😂', '🤯', '😮‍💨'];

  const handlePost = async () => {
    setIsLoading(true);
    setError(null);
    const meta: any = { highLevel, soundtrack: '', mood, strain };

    try {
        await onPost(content, isLocal ? 'LOCAL_LOUD' : 'HIGHLINE', image, meta, false);
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
                <h2 className="text-lg font-bold">Create a Post</h2>
                <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><XCircle size={20} /></button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                 <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="What's sparking up?"
                    className="w-full bg-transparent p-2 focus:outline-none resize-none text-lg placeholder:text-[var(--text-muted)]"
                    rows={4}
                />
                
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
                {showMeta && renderHighlineForm()}
            </div>
            <div className="flex justify-between items-center p-4 border-t border-[var(--border)]">
                <div className="flex gap-1 items-center">
                    <label htmlFor="image-upload-modal" className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer rounded-full hover:bg-[var(--accent-light)] transition-colors"><ImageIcon size={20} /></label>
                    <input id="image-upload-modal" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <button onClick={() => setShowMeta(!showMeta)} className={`p-2 rounded-full transition-colors ${showMeta ? 'text-[var(--accent)] bg-[var(--accent-light)]' : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]'}`}><Plus size={20} /></button>
                </div>
                <button onClick={handlePost} disabled={!content.trim() || isLoading} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Spark It'}
                    <Send size={14} />
                </button>
            </div>
        </div>
      </div>
  )
};

export default CreatePostModal;
