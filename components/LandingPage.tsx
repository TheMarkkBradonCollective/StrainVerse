import React from 'react';
import AuthScreen from './AuthScreen';
import { Users, Search, Leaf, Star, MessageSquare } from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onSuccess: () => void;
}

const FeatureCard: React.FC<{ icon: React.ElementType; title: string; description: string; delay: string; }> = ({ icon: Icon, title, description, delay }) => (
    <div className="bg-[var(--bg-card)] p-4 rounded-[1.5rem] border border-[var(--border)] shadow-[var(--shadow-card)] fade-in-up" style={{ animationDelay: delay }}>
        <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
                <Icon size={16} className="text-[var(--accent)]" />
            </div>
            <h3 className="font-bold text-[var(--text-main)]">{title}</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
    </div>
);


const MockStrainCard: React.FC<{ delay: string }> = ({ delay }) => (
    <div className="bg-[var(--indica-blush)] p-4 rounded-[1.5rem] border border-transparent shadow-[var(--shadow-card)] fade-in-up sm:col-span-2 overflow-hidden relative" style={{ animationDelay: delay }}>
        <div className="flex gap-3 relative z-10">
            <div className="w-20 h-20 bg-white/70 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm">
                 <Leaf size={32} className="text-[var(--accent)] float-y" />
            </div>
            <div className="flex-1">
                <div className="h-5 w-3/4 bg-[var(--text-main)]/10 rounded-full mb-2"></div>
                <div className="flex items-center gap-2">
                    <div className="px-2.5 py-0.5 bg-white/80 text-[var(--indica-purple)] text-[10px] font-bold rounded-full">Indica</div>
                    <div className="px-2.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold rounded-full">Relaxed</div>
                </div>
                 <div className="flex items-center gap-4 text-[var(--text-muted)] mt-3">
                    <div className="flex items-center gap-1"><Star size={12} className="text-amber-500" /><span className="text-xs font-semibold">4.8</span></div>
                    <div className="flex items-center gap-1"><MessageSquare size={12} /><span className="text-xs font-semibold">18</span></div>
                </div>
            </div>
        </div>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onSuccess }) => {
  return (
    <div className="min-h-dvh w-full text-[var(--text-main)] relative overflow-x-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[var(--leaf-mint)]/30 blur-[100px]" style={{ animation: 'drift-soft 18s ease-in-out infinite' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--sativa-sky)]/50 blur-[110px]" style={{ animation: 'drift-soft 22s ease-in-out infinite reverse' }}></div>
            <div className="absolute top-[45%] left-[35%] w-[35%] h-[35%] rounded-full bg-[var(--indica-blush)]/40 blur-[90px]" style={{ animation: 'drift-soft 16s ease-in-out infinite' }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row min-h-dvh">
            <div className="p-8 pt-16 pb-12 lg:flex-1 lg:p-12 xl:p-20 flex flex-col lg:justify-center items-center lg:items-start">
                <div className="w-full max-w-lg text-center lg:text-left">
                    <div className="mb-12">
                         <div className="flex justify-center lg:justify-start mb-5">
                            <Logo size="lg" titleClassName="text-5xl md:text-6xl tracking-tighter" />
                         </div>
                        <p className="text-xl md:text-2xl text-[var(--text-secondary)] font-medium mb-4 lg:pl-[4.25rem]">
                          The Universe of Strains, Powered by You.
                        </p>
                        <p className="text-md text-[var(--text-muted)] leading-relaxed lg:pl-[4.25rem]">
                           Discover, discuss, and share your favorite strains. StrainVerse is a social network built for the culture, centered around a living, community-powered encyclopedia of cannabis.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FeatureCard 
                            delay="0.15s" 
                            icon={Search} 
                            title="Explore Strains" 
                            description="Dive into a massive directory of strains with community photos and reviews." 
                        />
                         <FeatureCard 
                            delay="0.3s" 
                            icon={Users} 
                            title="Join Smoke Circles" 
                            description="Every strain has a live chat. Find your people and share your experience." 
                        />
                        <MockStrainCard delay="0.45s" />
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 flex items-center justify-center p-8 lg:p-12 lg:bg-[var(--bg-card)]/60 lg:backdrop-blur-xl lg:border-l lg:border-[var(--border)]">
                <div className="w-full max-w-md fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <AuthScreen onSuccess={onSuccess} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default LandingPage;
