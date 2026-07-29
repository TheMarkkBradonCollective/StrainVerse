// Fix: Corrected malformed import statement
import React, { useState } from 'react';
import { User, Post, Strain, ReactionType } from '../types';
import { MessageSquare, Heart, Share2, ThumbsDown, Flame, FileText, Users, MapPin, Cigarette, Leaf as LeafIcon, Settings, ThumbsUp, Trash2 } from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal';
import { api } from '../services/supabaseClient';

const DEFAULT_PROFILE_CSS = `.ys-profile-root {
  background: transparent;
  color: var(--text-main);
  font-family: var(--font-body);
}
.ys-header {
  border-bottom: 1px solid var(--border);
}
.ys-name {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-weight: 800;
}
.ys-avatar {
  border: 3px solid var(--border-strong);
  box-shadow: var(--shadow-soft);
}
.ys-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-card);
}
.ys-bio {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}`;

interface ProfileCanvasProps {
  user: User;
  posts: Post[];
  isOwner: boolean;
  friendCount: number;
  triedStrains: Strain[];
  refreshUser: () => Promise<void>;
  onReaction: (postId: string, type: ReactionType) => void;
  onDelete?: (postId: string) => void;
}

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; color: string; }> = ({ icon: Icon, label, value, color }) => (
    <div className="flex-1 bg-[var(--bg-card)] p-4 rounded-[1.35rem] border border-[var(--border)] shadow-[var(--shadow-card)] flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--accent-soft)]`}>
            <Icon size={20} className={color} />
        </div>
        <div>
            <p className="text-xl font-extrabold">{value}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{label}</p>
        </div>
    </div>
);


const ProfileCanvas: React.FC<ProfileCanvasProps> = ({ user, posts, isOwner, friendCount, triedStrains, refreshUser, onReaction, onDelete }) => {
  const [activeTab, setActiveTab] = useState('Posts');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveSettings = async (updates: Partial<User>) => {
    await api.updateProfile(user.id, updates);
    await refreshUser();
    setIsSettingsOpen(false);
  }
  
  const handleDeletePost = (postId: string) => {
    if (!onDelete || !window.confirm('Delete this post? This cannot be undone.')) return;
    onDelete(postId);
  };

  const reactionsToDisplay: ReactionType[] = ['THUMBS_UP', 'LIKE', 'FIRE', 'DISLIKE'];
  const reactionMap: Partial<Record<ReactionType, { icon: React.ReactNode, color: string, hoverColor: string }>> = {
      'THUMBS_UP': { icon: <ThumbsUp size={16} />, color: 'text-sky-500', hoverColor: 'hover:text-sky-500' },
      'LIKE': { icon: <Heart size={16} />, color: 'text-pink-500', hoverColor: 'hover:text-pink-500' },
      'FIRE': { icon: <Flame size={16} />, color: 'text-orange-500', hoverColor: 'hover:text-orange-500' },
      'DISLIKE': { icon: <ThumbsDown size={16} />, color: 'text-red-500', hoverColor: 'hover:text-red-500' },
  };

  const PlaceholderTab: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="ys-card p-8 text-center opacity-50 border border-dashed border-[var(--border)] rounded-xl">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p>{description}</p>
    </div>
  );

  const TriedStrainsView: React.FC<{ strains: Strain[] }> = ({ strains }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {strains.map(strain => (
            <div key={strain.id} className="ys-card bg-[var(--bg-card)] rounded-xl backdrop-blur-sm border border-[var(--border)] hover:border-[var(--border)] transition-colors overflow-hidden">
                <img src={strain.cover_image_url || `https://source.unsplash.com/random/400x300/?cannabis&sig=${strain.id}`} alt={strain.name} className="w-full h-24 object-cover" />
                <div className="p-4">
                    <h4 className="font-bold truncate">{strain.name}</h4>
                    <p className="text-xs text-[var(--text-muted)]">{strain.type}</p>
                </div>
            </div>
        ))}
         {strains.length === 0 && (
            <div className="ys-card p-8 text-center opacity-50 border border-dashed border-[var(--border)] rounded-xl col-span-full">
                No strains tried yet. Go explore the StrainVerse!
            </div>
        )}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full">
      <style dangerouslySetInnerHTML={{ __html: DEFAULT_PROFILE_CSS }} />
      {isSettingsOpen && <ProfileSettingsModal user={user} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />}

      <div className="ys-profile-root p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="ys-header mb-8 flex flex-col md:flex-row items-center md:items-end gap-6 pb-8 border-b border-[var(--border)]">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="ys-avatar w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-[var(--border)] shadow-xl" 
            />
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-[var(--accent)] rounded-full border-2 border-[var(--bg-card)] animate-pulse"></div>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="ys-name text-4xl md:text-6xl font-black tracking-tight mb-2">{user.name}</h1>
            <p className="text-xl opacity-75 mb-4">@{user.handle}</p>
            <p className="ys-bio text-lg max-w-2xl leading-relaxed">{user.bio}</p>
          </div>
          {isOwner && (
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[var(--bg-hover)] transition-colors">
                <Settings size={16} />
                Edit Profile
            </button>
          )}
        </header>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={FileText} label="Posts" value={posts.length} color="text-sky-400" />
            <StatCard icon={Users} label="Friends" value={friendCount} color="text-[var(--indica-purple)]" />
            <StatCard icon={LeafIcon} label="Strains Tried" value={triedStrains.length} color="text-pink-400" />
        </div>

        {/* Badges Section */}
        {user.badges && user.badges.length > 0 && (
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Badges</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {user.badges.map(badge => (
                        <div key={badge.id} className="flex flex-col items-center text-center w-20 flex-shrink-0 group" title={badge.description}>
                            <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-3xl mb-1 transition-all group-hover:bg-[var(--bg-input)] group-hover:border-[var(--accent)] group-hover:-translate-y-1">{badge.icon}</div>
                            <p className="text-xs font-bold text-[var(--text-secondary)]">{badge.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[var(--border)] mb-6 flex">
            {['Posts', 'Tried', 'Collections', 'Activity'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === tab ? 'text-[var(--text-main)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                    {tab}
                </button>
            ))}
        </div>

        {/* Layout Grid */}
        <div className="ys-layout-grid grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <aside className="ys-sidebar lg:col-span-4 space-y-6">
            <div className="bg-[var(--bg-card)] p-4 rounded-xl backdrop-blur-sm border border-[var(--border)]">
                <h3 className="text-lg font-bold mb-4 border-b border-[var(--border)] pb-2">About Me</h3>
                <div className="space-y-3 text-sm opacity-80">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{user.city && user.state ? `${user.city}, ${user.state}` : 'Location not set'}</span>
                    </div>
                    {user.smokingStyle && (
                        <div className="flex items-center gap-2">
                            <Cigarette size={14} />
                            <span>Prefers {user.smokingStyle}</span>
                        </div>
                    )}
                     {(user.favStrains && user.favStrains.length > 0) && (
                        <div className="flex items-start gap-2">
                            <LeafIcon size={14} className="mt-0.5"/>
                            <span>Faves: {user.favStrains.join(', ')}</span>
                        </div>
                    )}
                </div>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="ys-feed lg:col-span-8">
             {activeTab === 'Posts' && (
                <div className="space-y-6">
                    {posts.map(post => (
                    <div key={post.id} className="relative ys-card bg-[var(--bg-card)] rounded-xl p-6 backdrop-blur-sm border border-[var(--border)] hover:border-[var(--border)] transition-colors">
                        {isOwner && onDelete && (
                            <button
                                type="button"
                                onClick={() => handleDeletePost(post.id)}
                                className="absolute top-4 right-4 p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                aria-label="Delete post"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <div className="flex items-center gap-3 mb-4 pr-8">
                            <img src={post.userAvatar} className="w-10 h-10 rounded-full" alt="" />
                            <div>
                                <h4 className="font-bold flex items-center">{post.userName} {post.mood && <span className="text-2xl ml-2">{post.mood}</span>}</h4>
                                <span className="text-xs opacity-50">{new Date(post.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <p className="mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        {post.image && (
                            <img src={post.image} alt="Post content" className="w-full rounded-lg mb-4 object-cover max-h-[400px]" />
                        )}
                        <div className="flex items-center gap-6 pt-4 border-t border-[var(--border)]">
                            <div className="flex gap-4">
                                {reactionsToDisplay.map(type => (
                                    <button onClick={() => onReaction(post.id, type)} key={type} className={`flex items-center gap-1 text-xs transition-colors ${post.userReaction === type ? `${reactionMap[type]!.color} opacity-100` : `opacity-50 ${reactionMap[type]!.hoverColor}`}`}>
                                        {reactionMap[type]!.icon}
                                        <span className="font-mono">{post.reactions[type] || 0}</span>
                                    </button>
                                ))}
                            </div>
                            <button className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity text-sm ml-4">
                                <MessageSquare size={18} /> {post.comments}
                            </button>
                            <button className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity text-sm ml-auto">
                                <Share2 size={18} /> Share
                            </button>
                        </div>
                    </div>
                    ))}
                    {posts.length === 0 && (
                        <div className="ys-card p-8 text-center opacity-50 border border-dashed border-[var(--border)] rounded-xl">
                            No posts yet.
                        </div>
                    )}
                </div>
             )}
            {activeTab === 'Tried' && <TriedStrainsView strains={triedStrains} />}
            {activeTab === 'Collections' && <PlaceholderTab title="Collections" description="This feature is coming soon! Curate and share lists of your favorite strains." />}
            {activeTab === 'Activity' && <PlaceholderTab title="Activity Log" description="A feed of your recent actions is coming soon." />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileCanvas;
