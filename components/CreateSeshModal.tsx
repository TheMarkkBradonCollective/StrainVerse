import React, { useState } from 'react';
import { XCircle, Users, Loader2 } from 'lucide-react';

interface CreateSeshModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string, type: 'PUBLIC' | 'FRIEND' | 'FAMILY') => Promise<void>;
}

const CreateSeshModal: React.FC<CreateSeshModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'FRIEND' | 'FAMILY'>('FRIEND');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Sesh name is required.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onCreate(name, description, type);
      onClose();
    } catch (err) {
      setError('Failed to create sesh. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const FormLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{children}</label>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-md flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users size={18} className="text-[var(--accent)]" /> Create a New Sesh
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-red-400 bg-red-500/10 p-2 rounded-lg text-sm">{error}</p>}
          <div>
            <FormLabel>Sesh Name</FormLabel>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Chill Zone"
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" 
            />
          </div>
          <div>
            <FormLabel>Description (Optional)</FormLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this sesh about?"
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm h-20 resize-none focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
           <div>
            <FormLabel>Sesh Type</FormLabel>
            <select
                value={type}
                onChange={(e) => setType(e.target.value as 'PUBLIC' | 'FRIEND' | 'FAMILY')}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)] appearance-none"
            >
                <option value="FRIEND">Friends Only</option>
                <option value="FAMILY">Family Only</option>
                <option value="PUBLIC">Public</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create Sesh'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSeshModal;
