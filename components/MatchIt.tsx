import React, { useState, useEffect } from 'react';
import { User, Post, PostVisibility, ReactionType, ReportCategory, MatchItInteraction, Group } from '../types';
import { Flame, MapPin, ThumbsDown, Heart, ThumbsUp, MoreVertical, AlertTriangle, ShieldOff, Flag, XCircle, Loader2, Send, MessageSquare, Sparkles, MessageCircle } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import VibeTapModal from './VibeTapModal';
import { SkeletonPost } from './common';
import { api } from '../services/supabaseClient';

const useTimeLeft = (isoString?: string | null) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!isoString) {
            setTimeLeft('N/A');
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date();
            const expiry = new Date(isoString);
            const diffSeconds = Math.round((expiry.getTime() - now.getTime()) / 1000);

            if (diffSeconds <= 0) return 'Expired';
            if (diffSeconds < 60) return `${diffSeconds}s left`;
            const diffMinutes = Math.floor(diffSeconds / 60);
            if (diffMinutes < 60) return `${diffMinutes}m left`;
            const diffHours = Math.floor(diffMinutes / 60);
            const remainingMinutes = diffMinutes % 60;
            if (remainingMinutes === 0) return `${diffHours}h left`;
            return `${diffHours}h ${remainingMinutes}m left`;
        };

        const interval = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(interval);
    }, [isoString]);

    return timeLeft;
};

const ReportModal: React.FC<{ post: Post, user: User, onClose: () => void, onReport: (postId: string, reportedUserId: string, category: ReportCategory, reason: string) => void }> = ({ post, user, onClose, onReport }) => {
    const categories: ReportCategory[] = ['Suspicious activity', 'Underage', 'Spam', 'Harassment', 'Drugs for sale', 'Fake / catfishing'];
    const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedCategory) return;
        setIsSubmitting(true);
        await onReport(post.id, post.userId, selectedCategory, reason);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-md flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-red-400 flex items-center gap-2"><Flag size={18} /> Report Post</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><XCircle size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">Select a reason for reporting this post by <span className="font-bold text-[var(--text-secondary)]">{post.userName}</span>. This will be sent to moderators for review.</p>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`p-2 text-sm text-left rounded-lg border transition-colors ${selectedCategory === cat ? 'bg-red-500/15 border-red-500 text-red-700' : 'border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide additional details (optional)" className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm h-20 resize-none focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="p-4 border-t border-[var(--border)] flex justify-end">
                    <button onClick={handleSubmit} disabled={!selectedCategory || isSubmitting} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const MatchSuccessModal: React.FC<{ info: {group: Group, otherUser: {name: string, avatar: string}}, onClose: () => void, onGoToSesh: (groupId: string) => void }> = ({ info, onClose, onGoToSesh }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-sm flex flex-col items-center text-center p-8 shadow-2xl shadow-[var(--shadow-color)] relative" onClick={e => e.stopPropagation()}>
                <Sparkles size={48} className="text-orange-400 mb-4 animate-pulse" />
                <h2 className="text-2xl font-extrabold text-[var(--text-main)]">The vibes connected!</h2>
                <p className="text-[var(--text-muted)] mt-2">You and {info.otherUser.name} sparked a Sesh. You can now chat privately.</p>
                <div className="my-6">
                    <img src={info.otherUser.avatar} className="w-24 h-24 rounded-full border-4 border-[var(--accent)] shadow-lg" alt={info.otherUser.name} />
                </div>
                <button onClick={() => onGoToSesh(info.group.id)} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 px-4 rounded-lg">
                    Go to Sesh
                </button>
                 <button onClick={onClose} className="mt-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    Continue Matching
                </button>
            </div>
        </div>
    );
}

const MatchIt: React.FC<{ 
    user: User, 
    posts: Post[], 
    onReaction: (postId: string, type: ReactionType) => void, 
    onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isMatchIt?: boolean) => void, 
    isLoading: boolean, 
    userAge: number | null,
    onReportPost: (postId: string, reportedUserId: string, category: ReportCategory, reason: string) => Promise<void>,
    onBlockUser: (blockedId: string) => Promise<void>,
    onMatch: (groupId: string) => void,
    groups?: Group[],
    onSelectGroup?: (groupId: string) => void,
}> = ({ user, posts, onReaction, onPost, isLoading, userAge, onReportPost, onBlockUser, onMatch, groups, onSelectGroup }) => {
    const [isPostModalOpen, setPostModalOpen] = useState(false);
    const [reportingPost, setReportingPost] = useState<Post | null>(null);
    const [tappingPost, setTappingPost] = useState<Post | null>(null);
    const [matchSuccessInfo, setMatchSuccessInfo] = useState<{group: Group, otherUser: {name: string, avatar: string}} | null>(null);
    const [interactions, setInteractions] = useState<Record<string, MatchItInteraction[]>>({});
    const [activeTab, setActiveTab] = useState<'FIND' | 'CHATS'>('FIND');

    useEffect(() => {
        const fetchInteractions = async () => {
            if (posts.length === 0 || !user) return;
            const postIds = posts.map(p => p.id);
            const fetchedInteractions = await api.getInteractionsForPosts(postIds, user.id);
            
            const interactionsByPost = fetchedInteractions.reduce((acc, interaction) => {
                if (!acc[interaction.post_id]) {
                    acc[interaction.post_id] = [];
                }
                acc[interaction.post_id].push(interaction);
                return acc;
            }, {} as Record<string, MatchItInteraction[]>);
            setInteractions(interactionsByPost);
        };
        fetchInteractions();
    }, [posts, user]);

    const handleSendVibe = async (message: string, type: 'TAP' | 'SPARK') => {
        if (!tappingPost || !user) return;
        try {
            const { interaction, mutualMatch } = await api.sendVibe(tappingPost.id, user.id, tappingPost.userId, message, type);
            setTappingPost(null); 
            
            if (mutualMatch) {
                setMatchSuccessInfo({ group: mutualMatch, otherUser: { name: tappingPost.userName, avatar: tappingPost.userAvatar }});
            } else if (interaction) {
                setInteractions(prev => ({
                    ...prev,
                    [tappingPost.id]: [...(prev[tappingPost.id] || []), interaction]
                }));
            }
        } catch (e: any) {
            alert(e.message);
            setTappingPost(null);
        }
    };

    const handleRespondVibe = async (interaction: MatchItInteraction, response: 'MATCHED' | 'DECLINED') => {
        const matchedGroup = await api.respondToVibe(interaction.id, interaction.sender_id, interaction.receiver_id, response);
        if (response === 'MATCHED' && matchedGroup) {
            setMatchSuccessInfo({ group: matchedGroup, otherUser: { name: interaction.sender_name, avatar: interaction.sender_avatar }});
        }
        
        // Update local state to reflect change
        setInteractions(prev => {
            const postInteractions = (prev[interaction.post_id] || []).map(i => 
                i.id === interaction.id ? { ...i, status: response } : i
            );
            return { ...prev, [interaction.post_id]: postInteractions };
        });
    }

    const handleBlock = async (blockedUser: Post) => {
        if (window.confirm(`Are you sure you want to block ${blockedUser.userName}? You will no longer see their posts.`)) {
            await onBlockUser(blockedUser.userId);
        }
    };
    
    if (userAge && userAge < 21) {
        return (
            <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
                <AlertTriangle size={48} className="text-yellow-500/50 mb-4" />
                <h2 className="text-xl font-bold text-[var(--text-secondary)]">Age Restricted Content</h2>
                <p className="text-sm">For safety and compliance, MatchIt is only available to users 21 and older.</p>
            </div>
        )
    }

     if (!user.city || !user.state) {
        return (
            <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
                <MapPin size={48} className="text-[var(--border-strong)] mb-4" />
                <h2 className="text-xl font-bold text-[var(--text-secondary)]">Set Your Location</h2>
                <p className="text-sm max-w-sm">Please set your city and state in your profile to see local MatchIt posts from people in your area.</p>
            </div>
        )
    }

    const renderFeed = () => (
        <div className="pb-24 lg:pb-6 relative animate-in fade-in">
             {tappingPost && <VibeTapModal userName={tappingPost.userName} onClose={() => setTappingPost(null)} onSend={handleSendVibe} />}
             {matchSuccessInfo && <MatchSuccessModal info={matchSuccessInfo} onClose={() => setMatchSuccessInfo(null)} onGoToSesh={onMatch} />}
            {reportingPost && <ReportModal post={reportingPost} user={user} onClose={() => setReportingPost(null)} onReport={onReportPost} />}

            <div className="p-4 text-center border-b border-[var(--border)] bg-[var(--bg-card)]">
                <h3 className="font-bold text-lg text-orange-400">Welcome to MatchIt!</h3>
                <p className="text-sm text-[var(--text-muted)]">
                    This feed shows posts from users in your city and state ({user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}) who are looking to connect.
                </p>
            </div>

            {isLoading ? (
                <div><SkeletonPost /><SkeletonPost /><SkeletonPost /></div>
            ) : posts.map(post => (
                <MatchPostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                    interactions={interactions[post.id] || []}
                    onReaction={onReaction} 
                    onReportClick={() => setReportingPost(post)}
                    onBlockClick={() => handleBlock(post)}
                    onVibeClick={() => setTappingPost(post)}
                    onRespondVibe={handleRespondVibe}
                />
            ))}
             {!isLoading && posts.length === 0 && (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <p className="font-bold text-lg">It's quiet here...</p>
                    <p className="text-sm">No one in your city is matching right now.</p>
                </div>
            )}
        </div>
    );
    
    const renderChats = () => {
        const myMatches = (groups || []).filter(g => g.type === 'MATCH' && g.members.includes(user.id));
        return (
            <div className="p-4 space-y-3 pb-24 lg:pb-6 animate-in fade-in">
                {myMatches.length === 0 ? (
                    <div className="text-center py-20 text-[var(--text-muted)]">
                        <Flame size={48} className="mx-auto mb-4 opacity-50 text-orange-400" />
                        <p className="font-bold text-lg">No matches yet.</p>
                        <p className="text-sm">Start vibing on the feed to get matches!</p>
                    </div>
                ) : (
                    myMatches.map(group => {
                        // Attempt to deduce the other user's ID
                        const otherUserId = group.members.find(id => id !== user.id);
                        return (
                             <div key={group.id} onClick={() => onSelectGroup?.(group.id)} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 cursor-pointer hover:bg-[var(--bg-hover)] hover:border-orange-500 transition-all flex items-center gap-4 group">
                                <div className="relative">
                                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} className="w-14 h-14 rounded-full border-2 border-[var(--border)] group-hover:border-orange-500" alt="User Avatar" />
                                     <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-[var(--bg-card)]"></div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg truncate group-hover:text-orange-400 transition-colors">{group.name.replace(user.name, '').replace('&', '').replace("'s Sesh", '').trim() || group.name}</h4>
                                    <p className="text-sm text-[var(--text-muted)] truncate">Click to open chat...</p>
                                </div>
                                <MessageCircle className="text-[var(--text-muted)] group-hover:text-orange-400" />
                             </div>
                        );
                    })
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {isPostModalOpen && <CreatePostModal onClose={() => setPostModalOpen(false)} onPost={onPost} isLocal={false} isMatchItPost={true} />}
            
            <div className="flex border-b border-[var(--border)] bg-[var(--bg-card)]">
                <button 
                    onClick={() => setActiveTab('FIND')}
                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'FIND' ? 'border-orange-500 text-orange-400' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                    <Sparkles size={16} /> Find Vibe
                </button>
                <button 
                    onClick={() => setActiveTab('CHATS')}
                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'CHATS' ? 'border-orange-500 text-orange-400' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                    <MessageCircle size={16} /> My Matches
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'FIND' ? renderFeed() : renderChats()}
            </div>
            {activeTab === 'FIND' && (
                <button onClick={() => setPostModalOpen(true)} className="fixed bottom-24 lg:bottom-8 right-6 z-30 bg-orange-500 hover:bg-orange-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transition-transform hover:scale-105 active:scale-95">
                    <Flame size={28} className="text-white" />
                </button>
            )}
        </div>
    );
};

const MatchPostCard: React.FC<{post: Post; user: User; interactions: MatchItInteraction[]; onReaction: (postId: string, type: ReactionType) => void; onReportClick: () => void; onBlockClick: () => void; onVibeClick: () => void; onRespondVibe: (interaction: MatchItInteraction, response: 'MATCHED' | 'DECLINED') => void;}> = ({ post, user, interactions, onReaction, onReportClick, onBlockClick, onVibeClick, onRespondVibe }) => {
    const timeLeft = useTimeLeft(post.matchExpiresAt);
    const [menuOpen, setMenuOpen] = useState(false);
    
    const isOwner = post.userId === user.id;
    const userInteraction = interactions.find(i => i.sender_id === user.id);
    const incomingVibes = interactions.filter(i => i.receiver_id === user.id && i.status === 'PENDING');

    const vibeButtonText = () => {
        if (!userInteraction) return "Send Vibe";
        if (userInteraction.type === 'SPARK') return "Spark Sent 🔥";
        return "Vibe Sent";
    }

    return (
        <div className="p-4 border-b border-[var(--border)] transition-colors">
            <div className="flex gap-3">
                <img src={post.userAvatar} className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-bold text-[var(--text-main)] flex items-center">{post.userName} {post.mood && <span className="text-2xl ml-2">{post.mood}</span>}</h4>
                            {(post.authorCity && post.authorState) && (
                                <div className="text-xs text-[var(--text-muted)] font-bold flex items-center gap-1 mt-1">
                                    <MapPin size={12}/> {post.authorCity}, {post.authorState}
                                </div>
                            )}
                        </div>
                        {!isOwner && (
                            <div className="relative">
                                <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-input)] rounded-full">
                                    <MoreVertical size={18} />
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-lg shadow-lg z-10 animate-in fade-in duration-150">
                                        <button onClick={() => { onReportClick(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg-hover)] text-red-400">
                                            <Flag size={14} /> Report Post
                                        </button>
                                        <button onClick={() => { onBlockClick(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg-hover)]">
                                            <ShieldOff size={14} /> Block User
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-[var(--text-main)] whitespace-pre-wrap mt-2">{post.content}</p>
                    {post.image && <img src={post.image} className="mt-3 rounded-2xl border border-[var(--border)] max-h-96 w-full object-cover" />}
                    
                    <div className="mt-3 border border-[var(--border-strong)] rounded-lg p-3 text-sm space-y-2 bg-[var(--bg-input)]">
                        {post.matchLookingFor && <div className="flex items-start gap-2"><span className="font-bold text-orange-400/80 w-24 flex-shrink-0">Looking to:</span><span className="font-semibold text-[var(--text-main)]">{post.matchLookingFor}</span></div>}
                        {post.strain && <div className="flex items-start gap-2"><span className="font-bold text-orange-400/80 w-24 flex-shrink-0">Smoking:</span><span className="font-semibold text-[var(--text-main)]">{post.strain}</span></div>}
                        {post.matchExpiresAt && <div className="flex items-start gap-2"><span className="font-bold text-orange-400/80 w-24 flex-shrink-0">Expires:</span><span className={`font-semibold ${timeLeft === 'Expired' ? 'text-red-500' : 'text-[var(--text-main)]'}`}>{timeLeft}</span></div>}
                    </div>

                    {!isOwner ? (
                         <div className="mt-4">
                            <button onClick={onVibeClick} disabled={!!userInteraction} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                                <MessageSquare size={16} /> {vibeButtonText()}
                            </button>
                        </div>
                    ) : (
                        incomingVibes.length > 0 && (
                            <div className="mt-4 p-3 bg-[var(--bg-input)] rounded-lg border border-[var(--border)]">
                                <h5 className="text-sm font-bold mb-2">Incoming Vibes:</h5>
                                <div className="space-y-2">
                                    {incomingVibes.map(vibe => (
                                        <div key={vibe.id} className="flex items-center justify-between bg-[var(--bg-card)] p-2 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <img src={vibe.sender_avatar} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="text-sm font-bold">{vibe.sender_name} {vibe.type === 'SPARK' && '🔥'}</p>
                                                    <p className="text-xs text-[var(--text-muted)] italic">"{vibe.message}"</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => onRespondVibe(vibe, 'MATCHED')} className="px-3 py-1 text-xs font-bold bg-green-500 text-black rounded-full hover:bg-green-600">Match</button>
                                                <button onClick={() => onRespondVibe(vibe, 'DECLINED')} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)]"><XCircle size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}


export default MatchIt;