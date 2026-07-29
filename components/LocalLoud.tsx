import React, { useState, FC } from 'react';
import { User, Post, PostVisibility, ReactionType, Story } from '../types';
import { Send, Image as ImageIcon, XCircle, Flame, MapPin, Plus, CloudFog, HelpCircle, Heart, Compass, Calendar, BarChart2 } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import { StrainStories, SkeletonPost, FullscreenImage } from './common';

const PlaceholderTab: FC<{ title: string; icon: React.ElementType }> = ({ title, icon: Icon }) => (
    <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
        <Icon size={48} className="text-[var(--border-strong)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-secondary)]">{title}</h2>
        <p className="text-sm">This feature is coming soon!</p>
    </div>
);

const LocalLoud: React.FC<{ user: User, posts: Post[], onReaction: (postId: string, type: ReactionType) => void, onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isMatchIt?: boolean) => void, stories: Story[], isLoading: boolean }> = ({ user, posts, onReaction, onPost, stories, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'Feed' | 'Trends' | 'Hotspots' | 'Events'>('Feed');
    
    // Inline post creator state
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPostModalOpen, setPostModalOpen] = useState(false);

    const handlePost = () => {
        onPost(content, 'LOCAL_LOUD', image, {}, false);
        setContent('');
        setImage(null);
        setImagePreview(null);
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

    const reactionMap: Partial<Record<ReactionType, { icon: React.ReactNode | string, color: string, activeColor: string }>> = {
        'HIGH_AF': { icon: <Flame size={16} />, color: 'group-hover:text-orange-500', activeColor: 'text-orange-500' },
        'WEAK': { icon: <CloudFog size={16} />, color: 'group-hover:text-[var(--text-muted)]', activeColor: 'text-[var(--text-muted)]' },
        'FELT_THIS': { icon: <Heart size={16} />, color: 'group-hover:text-pink-500', activeColor: 'text-pink-500' },
        'BRUH': { icon: <HelpCircle size={16} />, color: 'group-hover:text-yellow-500', activeColor: 'text-yellow-500' },
        'MELTING': { icon: '🫠', color: '', activeColor: '' }, 'DROOLING': { icon: '🤤', color: '', activeColor: '' }, 'ZANY': { icon: '🤪', color: '', activeColor: '' }, 'LAUGHING': { icon: '😂', color: '', activeColor: '' }, 'MIND_BLOWN': { icon: '🤯', color: '', activeColor: '' }, 'RELIEF': { icon: '😮‍💨', color: '', activeColor: '' },
    };

    const reactionsToDisplay: ReactionType[] = ['HIGH_AF', 'WEAK', 'FELT_THIS', 'BRUH'];

    const renderFeed = () => (
        <div className="pb-24 lg:pb-6 relative">
            {isPostModalOpen && <CreatePostModal onClose={() => setPostModalOpen(false)} onPost={onPost} isLocal />}
            <StrainStories stories={stories} />

             {/* Inline Post Creator */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-strong)]">
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's sparking up locally?" className="w-full bg-transparent p-2 focus:outline-none resize-none text-lg placeholder:text-[var(--text-muted)]" rows={3}/>
                    {imagePreview && (
                        <div className="relative p-2 group">
                            <img src={imagePreview} className="rounded-lg max-h-60 w-auto" alt="Post preview" />
                            <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-4 right-4 bg-black/70 p-1 rounded-full text-white hover:scale-110 transition-transform"><XCircle size={20} /></button>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2 items-center">
                            <label htmlFor="image-upload-local" className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer rounded-full hover:bg-[var(--accent-light)] transition-colors"><ImageIcon size={20} /></label>
                            <input id="image-upload-local" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </div>
                        <button onClick={handlePost} disabled={!content.trim()} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                            Spark It <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <button onClick={() => setPostModalOpen(true)} className="fixed bottom-20 lg:bottom-8 right-8 z-30 bg-orange-600 hover:bg-orange-700 w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-orange-600/40 transition-transform hover:scale-105 active:scale-95">
                <Plus size={32} className="text-white" />
            </button>

            {/* Post List */}
            {isLoading ? (
                <div><SkeletonPost /><SkeletonPost /><SkeletonPost /></div>
            ) : posts.map(post => (
                <div key={post.id} className="p-4 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                    {post.distance && (<div className="text-xs text-[var(--accent)] font-bold mb-2 flex items-center gap-1"><MapPin size={12}/> {post.distance.toFixed(1)}km away</div>)}
                    <div className="flex gap-3">
                        <img src={post.userAvatar} className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                                <h4 className="font-bold text-[var(--text-main)]">{post.userName}</h4>
                                <span className="text-sm text-[var(--text-muted)]">@{post.userName.toLowerCase()}</span>
                                <span className="text-sm text-[var(--text-muted)]">· {new Date(post.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[var(--text-main)] whitespace-pre-wrap mt-1">{post.content}</p>
                            {post.image && (
                                <FullscreenImage
                                    src={post.image}
                                    alt={`Post by ${post.userName}`}
                                    className="mt-3 rounded-2xl border border-[var(--border)] max-h-96 w-full object-cover"
                                />
                            )}
                            <div className="flex items-center justify-around text-[var(--text-muted)] mt-4">
                                {reactionsToDisplay.map(type => (
                                    <button key={type} onClick={() => onReaction(post.id, type)} className={`flex items-center gap-2 text-sm font-mono group transition-colors ${post.userReaction === type ? reactionMap[type]!.activeColor : 'hover:text-[var(--text-main)]'}`}>
                                        <span className={`${reactionMap[type]!.color} transition-colors text-lg`}>{reactionMap[type]!.icon}</span>
                                        {post.reactions[type] || 0}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'Trends': return <PlaceholderTab title="Local Trends" icon={BarChart2} />;
            case 'Hotspots': return <PlaceholderTab title="Hotspots Map" icon={Compass} />;
            case 'Events': return <PlaceholderTab title="Local Events" icon={Calendar} />;
            case 'Feed':
            default: return renderFeed();
        }
    };

    const TabButton: React.FC<{ label: typeof activeTab; icon: React.ElementType }> = ({ label, icon: Icon }) => (
        <button onClick={() => setActiveTab(label)} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === label ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-main)]/80 backdrop-blur-sm z-10">
                <h2 className="text-lg font-bold">Local Loud</h2>
            </div>
            <div className="border-b border-[var(--border)] flex">
                <TabButton label="Feed" icon={MapPin} />
                <TabButton label="Trends" icon={BarChart2} />
                <TabButton label="Hotspots" icon={Compass} />
                <TabButton label="Events" icon={Calendar} />
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default LocalLoud;