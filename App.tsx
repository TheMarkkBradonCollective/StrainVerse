import React, { useState, useEffect, useRef } from 'react';
import { AppView, User, Post, Group, PostVisibility, ReactionType, GrowPlant, Story, GameScore, Strain, StrainPhoto, StrainReview, StrainChatMessage, ReportCategory } from './types';
import StrainVerseAppIcon from './components/icons/StrainVerseAppIcon';
import { Globe, MapPin, Users, User as UserIcon, Send, Flame, Image as ImageIcon, XCircle, Music, Leaf, Rocket, CloudFog, HelpCircle, Heart, Radio, Camera, Plus, Search, LogOut, Settings, Loader2, Wand2, Quote, ArrowLeft, Star, MessageSquare, Lightbulb, Copy, Filter } from 'lucide-react';
import ProfileCanvas from './components/ProfileCanvas';
import { api, auth, supabase, isSupabaseConfigured, ensureStrainVerseProfile } from './services/supabaseClient';
import LandingPage from './components/LandingPage';
import SetupRequired from './components/SetupRequired';
import StrainVerseDirectory from './components/StrainVerseDirectory';
import StrainProfilePage from './components/StrainProfilePage';
import Sidebar from './components/Sidebar';
import MatchIt from './components/MatchIt';
import HighlineFeed from './components/HighlineFeed';
import SocialSeshDirectory from './components/SocialSeshDirectory';
import SocialSeshView from './components/SocialSeshView';
import CreateStoryModal from './components/CreateStoryModal';
import Logo, { LogoMark } from './components/Logo';
import { getVisibleNavItems } from './navConfig';
import { formatAppVersion } from './utils/appVersion';


// --- VIEW CONFIGURATION ---
// Fix: Add explicit type to viewConfig to handle optional 'ageGate' property.
const viewConfig: Record<AppView, { title: string; icon: React.ElementType; ageGate?: boolean }> = {
  [AppView.STRAINVERSE]: { title: 'StrainVerse', icon: StrainVerseAppIcon },
  [AppView.HERBHUB]: { title: 'HerbHub', icon: Globe },
  [AppView.MATCHIT]: { title: 'MatchIt', icon: Flame, ageGate: true },
  [AppView.SOCIALSESH]: { title: 'SocialSesh', icon: Users },
  [AppView.PROFILE]: { title: 'My Stash', icon: UserIcon },
};

// --- UTILITY FUNCTIONS ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const base64toFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid base64 string");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const calculateAge = (dobString?: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


// --- SUB-COMPONENTS ---

// 5. PROFILE VIEW
const ProfileView: React.FC<{ user: User, posts: Post[], friendCount: number, triedStrains: Strain[], refreshUser: () => Promise<void>, onReaction: (postId: string, type: ReactionType) => void, onDelete: (postId: string) => void }> = ({ user, posts, friendCount, triedStrains, refreshUser, onReaction, onDelete }) => {
    return (
        <ProfileCanvas 
            user={user} 
            posts={posts} 
            isOwner={true} 
            friendCount={friendCount} 
            triedStrains={triedStrains} 
            refreshUser={refreshUser}
            onReaction={onReaction}
            onDelete={onDelete}
        />
    )
};


// --- LAYOUT COMPONENTS ---
const RightSidebar: React.FC<{ user: User }> = ({ user }) => {
    const vibes = [
        "The highest minds have the quietest thoughts.",
        "Keep it weird, stay lifted.",
        "Inhale the good, exhale the bad.",
        "A friend with weed is a friend indeed.",
        "Roll it, light it, smoke it, love it."
    ];
    const [vibe, setVibe] = useState(vibes[0]);

    useEffect(() => {
        setVibe(vibes[Math.floor(Math.random() * vibes.length)]);
    }, []);

    return (
    <aside className="w-80 h-screen sticky top-0 border-l border-[var(--border)] p-6 hidden xl:flex flex-col gap-6 bg-[var(--bg-card)]/50 backdrop-blur-xl">
       <div className="bg-[var(--hybrid-mist)] border border-transparent p-5 rounded-[1.5rem] shadow-[var(--shadow-card)]">
            <h3 className="font-extrabold text-lg mb-4 text-[var(--accent)]">Stoner Wisdom</h3>
            <div className="text-sm text-[var(--text-secondary)] italic flex gap-3 leading-relaxed">
                <Quote size={20} className="text-[var(--accent)]/40 flex-shrink-0" />
                {vibe}
            </div>
       </div>
       <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-[1.5rem] shadow-[var(--shadow-card)]">
            <h3 className="font-extrabold text-lg mb-4 text-[var(--text-main)]">Fav Strains</h3>
            <div className="flex flex-wrap gap-2">
                {(user.favStrains && user.favStrains.length > 0) ? (
                    user.favStrains.map(strain => (
                        <span key={strain} className="bg-[var(--bg-input)] text-xs font-bold px-3 py-1.5 rounded-full text-[var(--text-secondary)]">{strain}</span>
                    ))
                ) : (
                    <p className="text-xs text-[var(--text-muted)]">No favorite strains set yet.</p>
                )}
            </div>
       </div>
    </aside>
    );
};

const Header: React.FC<{
  title: string;
  onBack?: () => void;
  currentView: AppView;
  branded?: boolean;
}> = ({ title, onBack, currentView, branded = false }) => {
    if (branded) {
        return (
            <header className="px-4 pt-3 pb-3 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur-md z-20">
                <Logo showTagline size="lg" titleClassName="text-2xl sm:text-3xl" className="fade-in-up" />
            </header>
        );
    }

    return (
        <header className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-main)]/85 backdrop-blur-md z-10 flex items-center justify-center">
            {onBack && (
                <button onClick={onBack} className="absolute left-4 p-2.5 hover:bg-[var(--bg-card)] rounded-full border border-[var(--border)] shadow-sm transition-colors">
                    <ArrowLeft size={18} />
                </button>
            )}
            <h1 className="text-center font-extrabold text-lg tracking-tight text-[var(--text-main)]">{title}</h1>
            {currentView === AppView.HERBHUB && (
                <div className="absolute right-4">
                    <button className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] rounded-full border border-transparent hover:border-[var(--border)] transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            )}
        </header>
    );
};


const SESSION_TIMEOUT_MS = 12000;

const withTimeout = async <T,>(promise: Promise<T>, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
            () => reject(new Error(`${label} timed out after ${SESSION_TIMEOUT_MS}ms`)),
            SESSION_TIMEOUT_MS
        );
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userAge, setUserAge] = useState<number | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isPostsLoading, setIsPostsLoading] = useState(true);
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [friendCount, setFriendCount] = useState(0);
    const [triedStrains, setTriedStrains] = useState<Strain[]>([]);
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);
    
    // New Modal State
    const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);

    // Navigation State
    const [currentView, setCurrentView] = useState<AppView>(AppView.STRAINVERSE);
    const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);

    const checkSession = async () => {
        if (!isSupabaseConfigured) {
            setSessionChecked(true);
            return;
        }
        try {
            const { data: { session } } = await withTimeout(auth.getSession(), 'Session check');
            if (session) {
                try {
                    const currentUser = await withTimeout(api.getCurrentUser(), 'Profile load');
                    setUser(currentUser);
                    if (currentUser) {
                        setUserAge(calculateAge(currentUser.dateOfBirth));
                    }
                } catch (profileError) {
                    console.error('Profile load failed during session check:', profileError);
                    await auth.signOut();
                    setUser(null);
                    setUserAge(null);
                }
            } else {
                setUser(null);
                setUserAge(null);
            }
        } catch (error) {
            console.error('Failed to check session:', error);
            setUser(null);
            setUserAge(null);
        } finally {
            setSessionChecked(true);
        }
    };

    const refreshUser = async () => {
        if (user) {
            const refreshedUser = await api.getCurrentUser();
            setUser(refreshedUser);
             if (refreshedUser) {
                setUserAge(calculateAge(refreshedUser.dateOfBirth));
            }
        }
    }

    const fetchGroups = async () => {
        setGroups(await api.getAllGroups());
    };
    
    const refreshCurrentViewPosts = async (opts?: { silent?: boolean }) => {
        if (!user) return;
        
        // MatchIt is a people feed now — it loads its own data
        if (currentView === AppView.MATCHIT) return;

        let viewType: 'HIGHLINE' | 'FRIENDS' | undefined = undefined;
        if (currentView === AppView.HERBHUB) viewType = 'HIGHLINE';

        if (viewType) {
             if (!opts?.silent) setIsPostsLoading(true);
             api.getPosts(viewType, user).then(fetchedPosts => {
                setPosts(fetchedPosts);
                setIsPostsLoading(false);
             });
        }
    }


    useEffect(() => {
        checkSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                await ensureStrainVerseProfile(session.user);
            }
            if (event === 'INITIAL_SESSION') return;
            checkSession();
        });
        return () => subscription.unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!user) return;
        
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const radius = user.distanceRadius || 25;
                try {
                    await api.updateUserLocation(user.id, latitude, longitude, radius);
                    setUser((prev) =>
                      prev
                        ? { ...prev, latitude, longitude, distanceRadius: radius }
                        : prev
                    );
                } catch (err) {
                    console.warn('Could not save location:', err);
                }
            },
            err => console.warn("Could not get location:", err.message)
        );

        const fetchInitialData = async () => {
            fetchGroups();
            setMyPosts(await api.getPostsForUser(user.id));
            setTriedStrains(await api.getTriedStrains(user.id));
            setStories(await api.getStories());
            const friends = await api.getFriendIds(user.id);
            setFriendCount(friends.length);
        };
        fetchInitialData();

        // Auto-refresh stories / groups / profile posts while the app is open
        const softRefresh = () => {
            if (document.visibilityState !== 'visible') return;
            void fetchGroups();
            void api.getStories().then(setStories);
            void api.getPostsForUser(user.id).then(setMyPosts);
            void api.getTriedStrains(user.id).then(setTriedStrains);
        };
        const onVisible = () => softRefresh();
        document.addEventListener('visibilitychange', onVisible);
        const intervalId = window.setInterval(softRefresh, 60 * 1000);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.clearInterval(intervalId);
        };
    }, [user?.id]);
    
    // --- DATA FETCHING based on view ---
    useEffect(() => {
        refreshCurrentViewPosts();
    }, [currentView, user]);

    // Auto-refresh the active feed while HerbHub is open
    useEffect(() => {
        if (!user || currentView !== AppView.HERBHUB) return;
        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            void refreshCurrentViewPosts({ silent: true });
        };
        const onVisible = () => tick();
        document.addEventListener('visibilitychange', onVisible);
        const intervalId = window.setInterval(tick, 45 * 1000);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.clearInterval(intervalId);
        };
    }, [currentView, user]);

    // --- ACTIONS ---
    const handleSignOut = () => auth.signOut();

    const createReactionHandler = (postState: Post[], setPostState: React.Dispatch<React.SetStateAction<Post[]>>) => async (postId: string, type: ReactionType) => {
        if (!user) return;

        const originalPosts = [...postState];
        setPostState(currentPosts => currentPosts.map(p => {
            if (p.id === postId) {
                const newReactions = { ...p.reactions };
                const currentUserReaction = p.userReaction;

                if (currentUserReaction === type) {
                    newReactions[type] = (newReactions[type] || 1) - 1;
                    return { ...p, reactions: newReactions, userReaction: null };
                }
                
                if (currentUserReaction) {
                    newReactions[currentUserReaction] = (newReactions[currentUserReaction] || 1) - 1;
                }
                
                newReactions[type] = (newReactions[type] || 0) + 1;
                return { ...p, reactions: newReactions, userReaction: type };
            }
            return p;
        }));

        try {
            await api.toggleReaction(postId, user.id, type);
        } catch (error) {
            console.error("Failed to toggle reaction:", error);
            setPostState(originalPosts); // Revert on error
        }
    };

    const handleFeedReaction = createReactionHandler(posts, setPosts);
    const handleMyPostsReaction = createReactionHandler(myPosts, setMyPosts);
    
    const handlePost = async (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isMatchIt?: boolean) => {
        if (!user) return;

        let imageUrl: string | null = null;
        if (image) {
            imageUrl = await api.uploadImage(image);
        }

        let matchExpiresAt: string | undefined = undefined;
        if (isMatchIt && meta?.duration) {
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + meta.duration);
            matchExpiresAt = expires.toISOString();
        }

        await api.createPost(
            user.id,
            content,
            visibility,
            imageUrl,
            user.latitude,
            user.longitude,
            undefined, // groupId
            meta?.strain,
            meta?.highLevel,
            meta?.soundtrack,
            isMatchIt,
            meta?.mood,
            meta?.lookingFor,
            matchExpiresAt
        );

        refreshCurrentViewPosts();

        if (currentView === AppView.PROFILE || visibility === "ONLY_ME") {
            setMyPosts(await api.getPostsForUser(user.id));
        }
    };

    const handleReportPost = async (postId: string, reportedUserId: string, category: ReportCategory, reason: string) => {
        if (!user) return;
        await api.reportPost(user.id, reportedUserId, postId, category, reason);
        alert('Report submitted. Thank you for helping keep the community safe.');
    };

    const handleReportUser = async (reportedUserId: string, category: ReportCategory, reason: string) => {
        if (!user) return;
        await api.reportPost(user.id, reportedUserId, null, category, reason);
        alert('Report submitted. Thank you for helping keep the community safe.');
    };

    const handleBlockUser = async (blockedId: string) => {
        if (!user) return;
        await api.blockUser(user.id, blockedId);
        refreshCurrentViewPosts();
    };

    const handleDeletePost = async (postId: string) => {
        if (!user) return;
        try {
            await api.deletePost(postId, user.id);
            setPosts(current => current.filter(p => p.id !== postId));
            setMyPosts(current => current.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('Could not delete this post. Please try again.');
        }
    };
    
    const handleSendMessage = async (text: string) => {
        if (!user || !activeGroup) return;
        await api.sendMessage(activeGroup.id, user.id, text);
        // After sending, refresh the active group to see the new message
        selectGroup(activeGroup.id);
    };
    
    const selectGroup = async (groupId: string) => {
        const groupDetails = await api.getGroupDetails(groupId);
        if (groupDetails) {
            setActiveGroup(groupDetails);
            setCurrentView(AppView.SOCIALSESH);
        }
    };

    const handleSetView = (view: AppView) => {
        setCurrentView(view);
        setActiveGroup(null);
        setSelectedStrain(null);
    }

    const handleCreateStory = async (imageFile: File, strainName?: string, highLevel?: number) => {
        if (!user) return;

        const imageUrl = await api.uploadStoryImage(imageFile);
        if (!imageUrl) {
            console.error("Failed to upload story image");
            setIsCreateStoryModalOpen(false); // Close modal on failure
            return;
        }

        const newStory = await api.createStory(user.id, imageUrl, strainName, highLevel);
        if (newStory) {
            // Add the new story to the beginning of the list for immediate UI update
            setStories(prevStories => [newStory, ...prevStories]);
        }
        setIsCreateStoryModalOpen(false);
    };
    
    const BottomNavBar: React.FC<{ currentView: AppView, setView: (view: AppView) => void, userAge: number | null }> = ({ currentView, setView, userAge }) => {
        const navItems = getVisibleNavItems(userAge);

        return (
            <nav className="fixed bottom-3 left-3 right-3 h-[4.25rem] bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-[1.75rem] flex justify-around items-center z-40 lg:hidden shadow-[var(--shadow-soft)] pb-[env(safe-area-inset-bottom,0px)]">
                {navItems.map(item => (
                    <button key={item.view} onClick={() => setView(item.view)} className={`flex flex-col items-center gap-0.5 transition-all w-full ${currentView === item.view ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                        <span className={`p-1.5 rounded-2xl transition-colors ${currentView === item.view ? 'bg-[var(--accent-soft)]' : ''}`}>
                          <item.icon size={22} strokeWidth={currentView === item.view ? 2.5 : 2} />
                        </span>
                        <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                ))}
            </nav>
        );
    };

    const renderCurrentView = () => {
        if (selectedStrain) {
            return <StrainProfilePage strain={selectedStrain} user={user!} />;
        }
        if (activeGroup) {
            return <SocialSeshView 
                group={activeGroup} 
                user={user!} 
                onSendMessage={handleSendMessage}
            />;
        }

        switch (currentView) {
            case AppView.STRAINVERSE:
                return <StrainVerseDirectory onStrainSelect={setSelectedStrain} />;
            case AppView.HERBHUB:
                return <HighlineFeed user={user!} posts={posts} onReaction={handleFeedReaction} onPost={handlePost} onDelete={handleDeletePost} stories={stories} isLoading={isPostsLoading} onAddStoryClick={() => setIsCreateStoryModalOpen(true)} />;
            case AppView.MATCHIT:
                return <MatchIt 
                            user={user!} 
                            userAge={userAge} 
                            onReportUser={handleReportUser} 
                            onBlockUser={handleBlockUser} 
                            onMatch={selectGroup} 
                            groups={groups} 
                            onSelectGroup={selectGroup}
                            refreshUser={refreshUser}
                            refreshGroups={fetchGroups}
                        />;
            case AppView.SOCIALSESH:
                return <SocialSeshDirectory groups={groups} onSelectGroup={selectGroup} refreshGroups={fetchGroups} user={user!} />;
            case AppView.PROFILE:
                return <ProfileView user={user!} posts={myPosts} friendCount={friendCount} triedStrains={triedStrains} refreshUser={refreshUser} onReaction={handleMyPostsReaction} onDelete={handleDeletePost} />;
            default:
                return <div className="p-8 text-center">Select a view</div>;
        }
    };
    
    const getHeaderTitle = () => {
        if (selectedStrain) return selectedStrain.name;
        if (activeGroup) return activeGroup.name;
        return viewConfig[currentView].title;
    }

    if (!sessionChecked) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[var(--bg-main)]">
                <LogoMark size="xl" className="float-y" />
                <p className="text-lg animate-pulse text-[var(--accent)]">Loading Your Universe...</p>
                <p className="text-xs font-semibold tracking-wide text-[var(--text-muted)]/80">
                    StrainVerse {formatAppVersion()}
                </p>
            </div>
        );
    }

    if (!isSupabaseConfigured) {
        return <SetupRequired />;
    }

    if (!user) {
        return <LandingPage onSuccess={checkSession} />;
    }

    const showBackButton = !!selectedStrain || !!activeGroup;
    const handleBack = () => {
        if (selectedStrain) setSelectedStrain(null);
        if (activeGroup) setActiveGroup(null);
    }

    const showBrandedHeader =
        currentView === AppView.STRAINVERSE && !selectedStrain && !activeGroup;

    return (
        <div className="bg-[var(--bg-main)] text-[var(--text-main)] font-sans min-h-screen overflow-x-hidden">
             {isCreateStoryModalOpen && <CreateStoryModal onClose={() => setIsCreateStoryModalOpen(false)} onPost={handleCreateStory} />}

            <div className="flex max-w-[1920px] mx-auto min-h-screen">
                <Sidebar
                    currentView={currentView}
                    setView={handleSetView}
                    user={user}
                    onSignOut={handleSignOut}
                    userAge={userAge}
                />
                <main className="flex-1 min-w-0 flex flex-col h-[100dvh] max-h-[100dvh]">
                    <Header
                        title={getHeaderTitle()}
                        onBack={showBackButton ? handleBack : undefined}
                        currentView={currentView}
                        branded={showBrandedHeader}
                    />
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {renderCurrentView()}
                    </div>
                </main>

                <RightSidebar user={user} />
            </div>

            <BottomNavBar currentView={currentView} setView={handleSetView} userAge={userAge} />
        </div>
    );
};

export default App;