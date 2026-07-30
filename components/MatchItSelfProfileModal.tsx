import React, { useRef, useState } from 'react';
import { Camera, Loader2, Save, XCircle, Leaf } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/supabaseClient';

const SMOKING_STYLES: NonNullable<User['smokingStyle']>[] = ['Joint', 'Blunt', 'Glass', 'Vape', 'Edibles'];

interface MatchItSelfProfileModalProps {
  user: User;
  lookingForLabels: string[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

/** Grindr-style editor for how you appear to others on MatchIt. */
const MatchItSelfProfileModal: React.FC<MatchItSelfProfileModalProps> = ({
  user,
  lookingForLabels,
  onClose,
  onSaved,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [smokingStyle, setSmokingStyle] = useState(user.smokingStyle || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB.');
      return;
    }
    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Add a display name / tag others will see.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      let avatarUrl = user.avatar;
      if (avatarFile) {
        const uploaded = await api.uploadImage(avatarFile, 'avatars');
        if (!uploaded) throw new Error('Could not upload photo. Try again.');
        avatarUrl = uploaded;
      }
      await api.updateProfile(user.id, {
        name: trimmed,
        bio: bio.trim(),
        smokingStyle: (smokingStyle || undefined) as User['smokingStyle'],
        avatar: avatarUrl,
      });
      await onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Could not save your MatchIt profile.');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="matchit-self-profile-title"
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-t-[1.75rem] sm:rounded-[1.75rem] w-full max-w-md shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 id="matchit-self-profile-title" className="text-lg font-bold text-[var(--text-main)]">
              Your MatchIt look
            </h2>
            <p className="text-xs text-[var(--text-muted)]">What nearby people see</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full" aria-label="Close">
            <XCircle size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-full aspect-[3/4] max-h-[42vh] bg-[var(--bg-input)] overflow-hidden group"
            aria-label="Upload profile photo"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
                <Camera size={36} />
                <span className="text-sm font-bold">Add a photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-[var(--text-main)] text-sm font-bold">
                <Camera size={16} /> Change photo
              </span>
            </div>
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold shadow">
              <Camera size={12} /> Edit photo
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePickPhoto}
          />

          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Display name / tag
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={40}
                placeholder="How you show up nearby"
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-orange-400"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">@{user.handle}</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Short bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="One line others might vibe with…"
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Prefers
              </label>
              <div className="flex flex-wrap gap-2">
                {SMOKING_STYLES.map(style => {
                  const on = smokingStyle === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSmokingStyle(on ? '' : style)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        on
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      <Leaf size={12} /> {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {lookingForLabels.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                  I&apos;m down for
                </p>
                <p className="text-sm text-[var(--text-main)] font-semibold">
                  {lookingForLabels.join(' · ')}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Change these with the I&apos;m down for pills on Nearby.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-[var(--text-muted)] border border-[var(--border)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-full text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchItSelfProfileModal;
