import React, { useState, useEffect, useRef } from 'react';
import { Strain, User, StrainPhoto, StrainReview, StrainChatMessage } from '../types';
import { api } from '../services/supabaseClient';
import { Sprout, Star, MessageSquare, Image as ImageIcon, Send, Upload, Dna, Atom, Wind, Leaf as LeafIcon, Loader2, Flame, Diamond, XCircle, Tag } from 'lucide-react';

interface StrainProfilePageProps {
  strain: Strain;
  user: User;
}

type StrainForm = 'FLOWER' | 'CONCENTRATE';

const AddReview: React.FC<{ strainId: string; userId: string; onReviewSaved: (review: StrainReview) => void; form: StrainForm; userReview: StrainReview | null; }> = ({ strainId, userId, onReviewSaved, form, userReview }) => {
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userReview) {
            setRating(userReview.rating);
            setText(userReview.text || '');
        } else {
            setRating(0);
            setText('');
        }
    }, [userReview]);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            const newReview = await api.addStrainReview(strainId, userId, rating, text, form);
            onReviewSaved(newReview);
        } catch (err: any) {
            setError(err.message || 'An error occurred while submitting your review.');
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <div className="bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-bold mb-3">{userReview ? 'Edit Your Review' : 'Leave a Review'}</h4>
            {error && <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md mb-3">{error}</p>}
            <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setRating(star)}>
                        <Star size={24} className={`transition-colors cursor-pointer ${rating >= star ? 'text-amber-500 fill-current' : 'text-[var(--text-muted)] hover:text-[var(--text-muted)]'}`} />
                    </button>
                ))}
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience..." className="w-full bg-[var(--bg-input)] rounded p-2 text-sm h-24 border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]" />
            <button onClick={handleSubmit} disabled={isSubmitting} className="mt-2 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (userReview ? 'Update Review' : 'Submit Review')}
            </button>
        </div>
    );
};

const UploadPhoto: React.FC<{ strainId: string; userId: string; onPhotoAdded: (photo: StrainPhoto) => void; form: StrainForm; }> = ({ strainId, userId, onPhotoAdded, form }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [brand, setBrand] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };
    
    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        const imageUrl = await api.uploadStrainImage(file);
        if (imageUrl) {
            const newPhoto = await api.addStrainPhoto(strainId, userId, imageUrl, form, brand);
            if (newPhoto) {
                onPhotoAdded(newPhoto);
                // Reset state
                setFile(null);
                setPreview(null);
                setBrand('');
            }
        }
        setIsUploading(false);
    };
    
    if (preview) {
        return (
             <div className="bg-[var(--bg-input)] rounded-lg flex flex-col sm:flex-row gap-4 border-2 border-[var(--accent)] p-4 items-center">
                <img src={preview} className="w-24 h-24 object-contain rounded-lg bg-black/20" alt="Upload preview" />
                <div className="flex-1 w-full space-y-3">
                    <input 
                        type="text" 
                        value={brand} 
                        onChange={e => setBrand(e.target.value)}
                        placeholder="Brand? (optional)"
                        className="w-full bg-[var(--bg-card)] text-[var(--text-main)] text-sm border border-[var(--border)] rounded-full px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleUpload} disabled={isUploading} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold py-2 rounded-full disabled:opacity-50 flex items-center justify-center gap-2">
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Post'}
                        </button>
                        <button onClick={() => { setFile(null); setPreview(null); setBrand(''); }} className="flex-shrink-0 bg-gray-600 hover:bg-gray-700 text-white w-9 h-9 flex items-center justify-center rounded-full text-xs">
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>
             </div>
        )
    }

    return (
        <div onClick={() => !isUploading && fileInputRef.current?.click()} className="w-full bg-[var(--bg-input)] rounded-full flex items-center justify-center text-[var(--text-muted)] gap-2 border-2 border-dashed border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors group py-3">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Upload size={20} className="group-hover:text-[var(--accent)]"/>
            <span className="font-bold group-hover:text-[var(--accent)]">Add Photo</span>
        </div>
    );
};

const StrainProfilePage: React.FC<StrainProfilePageProps> = ({ strain: initialStrain, user }) => {
  const [strain, setStrain] = useState<Strain>(initialStrain);
  const [currentForm, setCurrentForm] = useState<StrainForm>('FLOWER');
  const [activeTab, setActiveTab] = useState<'photos' | 'reviews' | 'chat'>('photos');
  const [photos, setPhotos] = useState<StrainPhoto[]>([]);
  const [reviews, setReviews] = useState<StrainReview[]>([]);
  const [chatMessages, setChatMessages] = useState<StrainChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userReview, setUserReview] = useState<StrainReview | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<StrainPhoto | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStrain(initialStrain);
  }, [initialStrain]);

  useEffect(() => {
    api.getStrainPhotos(strain.id, currentForm).then(setPhotos);
    api.getStrainChatMessages(strain.id, currentForm).then(setChatMessages);
    api.getStrainReviews(strain.id, currentForm).then(fetchedReviews => {
        setReviews(fetchedReviews);
        const foundUserReview = fetchedReviews.find(r => r.user_id === user.id);
        setUserReview(foundUserReview || null);
    });
  }, [strain.id, currentForm, user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const handleReviewSaved = (savedReview: StrainReview) => {
    setReviews(prevReviews => {
        const existingIndex = prevReviews.findIndex(r => r.id === savedReview.id);
        if (existingIndex > -1) {
            const newReviews = [...prevReviews];
            newReviews[existingIndex] = savedReview;
            return newReviews;
        } else {
            return [savedReview, ...prevReviews];
        }
    });
    setUserReview(savedReview);
  };


  const handleToggleLog = (type: 'SMOKED' | 'DABBED') => {
      setStrain(prevStrain => {
          if (type === 'SMOKED') {
              return { ...prevStrain, user_has_smoked: !prevStrain.user_has_smoked };
          }
          return { ...prevStrain, user_has_dabbed: !prevStrain.user_has_dabbed };
      });
      api.toggleStrainLog(user.id, strain.id, type);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const tempId = Date.now().toString();
    const optimisticMessage: StrainChatMessage = {
        id: tempId,
        strain_id: strain.id,
        user_id: user.id,
        user_name: user.name,
        message: newMessage,
        created_at: new Date().toISOString(),
        form: currentForm,
    }
    setChatMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    const sentMessage = await api.sendStrainChatMessage(strain.id, user.id, newMessage, currentForm);
    if (sentMessage) {
        setChatMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
    } else {
        setChatMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };
  
  const TabButton: React.FC<{ label: typeof activeTab, text: string, icon: React.ElementType, count: number }> = ({ label, text, icon: Icon, count }) => (
      <button 
        onClick={() => setActiveTab(label)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === label 
            ? 'border-[var(--accent)] text-[var(--text-main)]' 
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
        }`}
      >
        <Icon size={16} />
        <span>{text}</span>
        <span className="text-xs bg-[var(--border-strong)] px-1.5 py-0.5 rounded-full">{count}</span>
      </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'photos':
        return <div>
            <div className="p-4 border-b border-[var(--border)]">
                <UploadPhoto strainId={strain.id} userId={user.id} onPhotoAdded={p => setPhotos(prev => [p, ...prev])} form={currentForm} />
            </div>
            <div className="grid grid-cols-3 gap-1 p-1">
                {photos.map(p => 
                    <div key={p.id} onClick={() => setSelectedPhoto(p)} className="relative group aspect-square cursor-pointer">
                        <img src={p.image_url} className="w-full h-full object-cover bg-[var(--bg-input)] rounded-lg transition-opacity group-hover:opacity-90" alt={`Photo of ${strain.name} by ${p.user_name}`} />
                        {p.brand && 
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                                <Tag size={10} />
                                {p.brand}
                            </div>
                        }
                    </div>
                )}
            </div>
        </div>;
      case 'reviews':
        return <div className="p-4 space-y-4">
            <AddReview strainId={strain.id} userId={user.id} onReviewSaved={handleReviewSaved} form={currentForm} userReview={userReview} />
            {reviews.map(r => (
                <div key={r.id} className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                             <img src={r.user_avatar} className="w-8 h-8 rounded-full" />
                             <span className="text-sm font-bold">{r.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-sm font-bold"><Star size={14} className="fill-current"/> {r.rating}/5</div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{r.text || <i>No comment.</i>}</p>
                </div>
            ))}
            {reviews.length === 0 && (
                <div className="text-center py-10 text-[var(--text-muted)]">
                    <p>No reviews yet. Be the first!</p>
                </div>
            )}
        </div>;
      case 'chat':
        return <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map(m => (
                    <div key={m.id} className={`flex items-start gap-2 ${m.user_id === user.id ? 'justify-end' : ''}`}>
                         <div className={`p-3 rounded-xl max-w-xs ${m.user_id === user.id ? 'bg-[var(--accent)] text-white rounded-br-none' : 'bg-[var(--bg-card)] rounded-bl-none'}`}>
                             {m.user_id !== user.id && <p className="text-xs font-bold text-[var(--accent)] mb-0.5">{m.user_name}</p>}
                             <p className="text-sm break-words">{m.message}</p>
                         </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="p-2 border-t border-[var(--border)] bg-[var(--bg-main)]">
                <div className="bg-[var(--bg-input)] rounded-full flex items-center pr-2 border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Join the conversation..." className="flex-1 bg-transparent p-3 focus:outline-none" />
                    <button onClick={handleSendMessage} className="p-2 bg-[var(--accent)] text-white rounded-full hover:scale-110 transition-transform"><Send size={16}/></button>
                </div>
            </div>
        </div>;
    }
  };

  const heroTone =
    (strain.type || '').toLowerCase() === 'sativa' ? 'bg-[var(--sativa-sky)]' :
    (strain.type || '').toLowerCase() === 'indica' ? 'bg-[var(--indica-blush)]' :
    'bg-[var(--hybrid-mist)]';

  return (
    <div className="flex flex-col h-full relative pb-20 lg:pb-0">
      <div className="p-4 border-b border-[var(--border)]">
        <div className={`${heroTone} rounded-[1.75rem] p-5 mb-4 shadow-[var(--shadow-card)] overflow-hidden relative`}>
          <div className="flex justify-between items-start gap-4 relative z-10">
              <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/80 text-[var(--accent)]">{strain.type}</span>
                  <h1 className="text-4xl font-extrabold mt-3 tracking-tight text-[var(--text-main)]">{strain.name}</h1>
                  <p className="text-sm mt-2 text-[var(--text-secondary)] max-w-xl leading-relaxed">{strain.description}</p>
              </div>
              <div className="text-right flex-shrink-0 bg-white/80 rounded-2xl px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-1 text-2xl font-bold text-amber-500 justify-end"><Star size={20} className="fill-current"/> {strain.avg_rating || 'N/A'}</div>
                  <span className="text-xs text-[var(--text-muted)]">{strain.review_count || 0} reviews</span>
              </div>
          </div>
          {strain.cover_image_url && (
            <img src={strain.cover_image_url} alt="" className="absolute -right-4 -bottom-8 w-40 h-40 object-cover rounded-full opacity-30 pointer-events-none" />
          )}
        </div>

        <div className="bg-[var(--bg-card)] p-1 rounded-full flex items-center border border-[var(--border)] shadow-sm">
            <button 
                onClick={() => setCurrentForm('FLOWER')}
                className={`flex-1 text-center font-bold text-sm py-2.5 rounded-full transition-all flex items-center justify-center gap-2 ${currentForm === 'FLOWER' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
                <LeafIcon size={16} /> Flower
            </button>
            <button 
                onClick={() => setCurrentForm('CONCENTRATE')}
                className={`flex-1 text-center font-bold text-sm py-2.5 rounded-full transition-all flex items-center justify-center gap-2 ${currentForm === 'CONCENTRATE' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
                <Diamond size={16} /> Concentrate
            </button>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button 
                onClick={() => handleToggleLog('SMOKED')}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all border ${
                    strain.user_has_smoked
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-600'
                        : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:border-orange-500/50 hover:text-orange-600'
                }`}
            >
                <Flame size={16} /> Smoked
            </button>
            <button 
                onClick={() => handleToggleLog('DABBED')}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all border ${
                    strain.user_has_dabbed
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700'
                        : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:border-cyan-500/50 hover:text-cyan-700'
                }`}
            >
                <Diamond size={16} /> Dabbed
            </button>
        </div>

        <div className="mt-4 pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3">
                    <h4 className="font-bold text-[var(--text-muted)] text-xs uppercase flex items-center gap-1 mb-1"><Dna size={12}/> Genetics</h4>
                    <p className="font-semibold">{strain.genetics || 'Unknown'}</p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3">
                    <h4 className="font-bold text-[var(--text-muted)] text-xs uppercase flex items-center gap-1 mb-1"><Atom size={12}/> THC</h4>
                    <p className="font-semibold">{strain.thc_min && strain.thc_max ? `${strain.thc_min}-${strain.thc_max}%` : 'N/A'}</p>
                </div>
            </div>
            <div>
                <h4 className="font-bold text-[var(--text-muted)] text-xs uppercase flex items-center gap-1 mb-2"><Wind size={12} /> Effects</h4>
                <div className="flex flex-wrap gap-2">
                    {(strain.effects || []).map(e => <span key={e} className="text-xs bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full capitalize font-medium">{e}</span>)}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-[var(--text-muted)] text-xs uppercase flex items-center gap-1 mb-2"><LeafIcon size={12}/> Flavors</h4>
                <div className="flex flex-wrap gap-2">
                    {(strain.flavors || []).map(f => <span key={f} className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full capitalize font-medium">{f}</span>)}
                </div>
            </div>
        </div>
      </div>
      <div className="border-b border-[var(--border)] flex">
        <TabButton label="photos" text="Photos" icon={ImageIcon} count={photos.length}/>
        <TabButton label="reviews" text="Reviews" icon={Star} count={reviews.length}/>
        <TabButton label="chat" text="Live Chat" icon={MessageSquare} count={chatMessages.length}/>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedPhoto(null)}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors z-[101]">
                <XCircle size={32} />
            </button>
            
            <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                <img 
                    src={selectedPhoto.image_url} 
                    alt={`Photo by ${selectedPhoto.user_name}`} 
                    className="max-h-[85vh] max-w-full w-auto object-contain rounded-lg shadow-2xl" 
                />
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-[var(--border)] p-2 pr-4 rounded-full flex items-center gap-3 shadow-lg">
                    <img src={selectedPhoto.user_avatar} className="w-8 h-8 rounded-full border border-[var(--border)]" alt={selectedPhoto.user_name} />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--text-main)]">{selectedPhoto.user_name}</span>
                         <span className="text-[10px] text-[var(--text-muted)]">{new Date(selectedPhoto.created_at).toLocaleDateString()} {selectedPhoto.brand && `• ${selectedPhoto.brand}`}</span>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StrainProfilePage;