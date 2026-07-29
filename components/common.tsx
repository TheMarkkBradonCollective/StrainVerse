import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { Camera, XCircle } from 'lucide-react';

export const SkeletonPost: React.FC = () => (
    <div className="p-4 border-b border-[var(--border)]">
        <div className="flex gap-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[var(--border-strong)]"></div>
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-[var(--border-strong)] rounded w-3/4"></div>
                <div className="h-4 bg-[var(--border-strong)] rounded w-full"></div>
                <div className="h-4 bg-[var(--border-strong)] rounded w-1/2"></div>
            </div>
        </div>
    </div>
);

export const FullscreenImage: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt = 'Post image', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen]);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="block w-full text-left"
                aria-label="View image full screen"
            >
                <img src={src} alt={alt} className={`${className} cursor-zoom-in`} />
            </button>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Close full screen image"
                    >
                        <XCircle size={28} />
                    </button>
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-full object-contain"
                        onClick={event => event.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export const StrainStories: React.FC<{stories: Story[], onAddStoryClick?: () => void}> = ({ stories, onAddStoryClick }) => {
    const [activeStory, setActiveStory] = useState<Story | null>(null);

    return (
        <>
            <div className="flex gap-4 overflow-x-auto py-6 px-4 no-scrollbar border-b border-[var(--border)]">
                <div onClick={onAddStoryClick} className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--accent)]/50 flex items-center justify-center bg-[var(--bg-input)] group-hover:bg-[var(--accent)]/20 transition-colors">
                        <Camera size={24} className="text-[var(--accent)]" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1">Add Story</span>
                </div>
                {stories.map(s => (
                    <div key={s.id} onClick={() => setActiveStory(s)} className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group">
                        <div className={`p-[3px] rounded-full bg-gradient-to-tr ${(s.high_level || 0) > 8 ? 'from-[var(--sunset-hybrid)] via-orange-500 to-[var(--indica-purple)] animate-pulse' : 'from-[var(--forest-green)] via-blue-500 to-purple-600'}`}>
                            <div className="p-[2px] bg-[var(--bg-card)] rounded-full relative">
                                 <img src={s.user_avatar} className="w-14 h-14 rounded-full object-cover" alt={s.user_name} />
                            </div>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate w-16 text-center group-hover:text-[var(--accent)] transition-colors">{s.user_name}</span>
                    </div>
                ))}
            </div>

            {activeStory && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setActiveStory(null)}>
                    <div className="w-full max-w-sm bg-[#111] rounded-2xl overflow-hidden border border-[var(--border-strong)] relative aspect-[9/16]" onClick={e => e.stopPropagation()}>
                         <img src={activeStory.image_url} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                         <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 flex flex-col justify-between p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <img src={activeStory.user_avatar} className="w-10 h-10 rounded-full border border-[var(--border)]0" />
                                    <div>
                                        <h3 className="font-bold text-[var(--text-main)] text-sm">{activeStory.user_name}</h3>
                                        <p className="text-xs text-[var(--text-muted)]">2h ago • High Level: {activeStory.high_level || 'N/A'}/10</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveStory(null)}><XCircle className="text-[var(--text-muted)]" /></button>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[var(--accent)] mb-2 neon-text-glow">{activeStory.strain_name || 'Vibes'}</h2>
                                <div className="flex gap-4 justify-center pt-4 border-t border-[var(--border)]">
                                    <button className="text-2xl hover:scale-125 transition-transform">🔥</button>
                                    <button className="text-2xl hover:scale-125 transition-transform">😂</button>
                                    <button className="text-2xl hover:scale-125 transition-transform">😭</button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </>
    )
}