import React, { useState, useEffect, useMemo } from 'react';
import { Strain } from '../types';
import { api } from '../services/supabaseClient';
import { Search, Star, Image as ImageIcon, Loader2, Flame, Diamond, LayoutGrid, List } from 'lucide-react';
import StrainVerseAppIcon from './icons/StrainVerseAppIcon';

interface StrainVerseDirectoryProps {
  onStrainSelect: (strain: Strain) => void;
}

type StrainViewMode = 'grid' | 'list';

const VIEW_MODE_KEY = 'strainverse-directory-view';

const typeTone = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'sativa') return { bg: 'bg-[var(--sativa-sky)]', badge: 'bg-sky-700/10 text-sky-800' };
  if (t === 'indica') return { bg: 'bg-[var(--indica-blush)]', badge: 'bg-[var(--indica-purple)]/15 text-[var(--indica-purple)]' };
  return { bg: 'bg-[var(--hybrid-mist)]', badge: 'bg-[var(--accent)]/15 text-[var(--accent)]' };
};

const StrainListRow: React.FC<{ strain: Strain; onSelect: () => void }> = ({ strain, onSelect }) => {
  const tone = typeTone(strain.type);
  return (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full flex items-center gap-4 p-3 ${tone.bg} border border-transparent rounded-[1.35rem] text-left transition-all duration-200 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5`}
  >
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-white/70 shadow-sm">
      <img
        src={strain.cover_image_url || `https://source.unsplash.com/random/400x600/?cannabis,plant,smoke&sig=${strain.id}`}
        alt={strain.name}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-[var(--text-main)] truncate">{strain.name}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tone.badge}`}>
          {strain.type}
        </span>
        {(strain.user_has_smoked || strain.user_has_dabbed) && (
          <span className="flex items-center gap-1">
            {strain.user_has_smoked && <Flame size={12} className="text-orange-500" />}
            {strain.user_has_dabbed && <Diamond size={12} className="text-cyan-600" />}
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{strain.description}</p>
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-2">
        <span className="flex items-center gap-1">
          <Star size={12} className="text-amber-500" />
          {strain.avg_rating ?? 'N/A'}
        </span>
        <span className="flex items-center gap-1">
          <ImageIcon size={12} />
          {strain.photo_count ?? 0}
        </span>
        {strain.effects?.length > 0 && (
          <span className="hidden sm:inline truncate">{strain.effects.slice(0, 3).join(' · ')}</span>
        )}
      </div>
    </div>
  </button>
  );
};

const StrainCard: React.FC<{ strain: Strain; onSelect: () => void; }> = ({ strain, onSelect }) => {
  const tone = typeTone(strain.type);
  return (
    <div 
      onClick={onSelect}
      className={`relative group ${tone.bg} rounded-[1.5rem] aspect-[3/4] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[var(--shadow-soft)] hover:-translate-y-1`}
    >
      <div className="absolute inset-x-3 top-3 bottom-[42%] rounded-[1.25rem] overflow-hidden bg-white/50">
        <img 
          src={strain.cover_image_url || `https://source.unsplash.com/random/400x600/?cannabis,plant,smoke&sig=${strain.id}`} 
          alt={strain.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      </div>
      
      {(strain.user_has_smoked || strain.user_has_dabbed) && (
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/90 p-1.5 rounded-full shadow-sm border border-white/60 z-10">
            {strain.user_has_smoked && <Flame size={14} className="text-orange-500" />}
            {strain.user_has_dabbed && <Diamond size={14} className="text-cyan-600" />}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 text-[var(--text-main)]">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${tone.badge}`}>{strain.type}</span>
        <h3 className="font-extrabold text-xl mt-2 truncate leading-tight">{strain.name}</h3>
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-1.5">
          <div className="flex items-center gap-1"><Star size={14} className="text-amber-500"/><span className="font-semibold">{strain.avg_rating || 'N/A'}</span></div>
          <div className="flex items-center gap-1"><ImageIcon size={14} /><span>{strain.photo_count || 0}</span></div>
        </div>
      </div>
    </div>
  );
};

const StrainVerseDirectory: React.FC<StrainVerseDirectoryProps> = ({ onStrainSelect }) => {
  const [strains, setStrains] = useState<Strain[]>([]);
  const [filteredStrains, setFilteredStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Sativa' | 'Indica' | 'Hybrid'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<StrainViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    const saved = window.localStorage.getItem(VIEW_MODE_KEY);
    return saved === 'list' ? 'list' : 'grid';
  });

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const mostReviewedStrains = useMemo(() => {
    const reviewed = strains.filter((s) => (s.review_count || 0) > 0);
    if (reviewed.length === 0) return [];
    return reviewed
      .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      .slice(0, 5);
  }, [strains]);

  useEffect(() => {
    const fetchStrains = async () => {
      setIsLoading(true);
      const data = await api.getStrains();
      setStrains(data);
      setFilteredStrains(data);
      setIsLoading(false);
    };
    fetchStrains();
  }, []);
  
  useEffect(() => {
    let result = strains;

    if (activeTab !== 'All') {
      result = result.filter(s => s.type === activeTab);
    }
    
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lowercasedTerm) ||
        (s.effects && s.effects.some(e => e.toLowerCase().includes(lowercasedTerm))) ||
        (s.flavors && s.flavors.some(f => f.toLowerCase().includes(lowercasedTerm)))
      );
    }

    setFilteredStrains(result);
  }, [activeTab, searchTerm, strains]);

  const TabButton: React.FC<{ label: typeof activeTab }> = ({ label }) => (
    <button
      onClick={() => setActiveTab(label)}
      className={`px-4 py-2 text-sm font-bold rounded-full transition-all whitespace-nowrap ${
        activeTab === label
          ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-color)]'
          : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
      }`}
    >
      {label}
    </button>
  );

  const ViewToggle: React.FC = () => (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        aria-label="Grid view"
        title="Grid view"
        className={`p-2.5 rounded-xl transition-colors ${
          viewMode === 'grid'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        aria-label="List view"
        title="List view"
        className={`p-2.5 rounded-xl transition-colors ${
          viewMode === 'list'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        <List size={16} />
      </button>
    </div>
  );

  const renderStrain = (strain: Strain) =>
    viewMode === 'grid' ? (
      <StrainCard key={strain.id} strain={strain} onSelect={() => onStrainSelect(strain)} />
    ) : (
      <StrainListRow key={strain.id} strain={strain} onSelect={() => onStrainSelect(strain)} />
    );

  return (
    <div className="p-4 pb-24 lg:pb-4">
      <div className="sticky top-0 bg-[var(--bg-main)]/85 backdrop-blur-md z-10 py-4 -mt-4">
          <div className="flex gap-2 mb-0">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search strains, flavors, effects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-full pl-11 pr-4 py-3.5 shadow-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
              />
            </div>
            <ViewToggle />
          </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : (
        <>
            {!searchTerm && mostReviewedStrains.length > 0 && (
                <div className="my-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-extrabold flex items-center gap-2">
                        <Star size={20} className="text-amber-500" /> Most Reviewed
                      </h2>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Top strains by community reviews.</p>
                    </div>
                    <div className={viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                      : 'flex flex-col gap-3'
                    }>
                        {mostReviewedStrains.map(strain => renderStrain(strain))}
                    </div>
                </div>
            )}
            
            <div className="my-6">
                 <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <h2 className="text-xl font-extrabold flex items-center gap-2"><StrainVerseAppIcon size={20} /> Explore Strains</h2>
                    <div className="hidden sm:flex gap-2">
                      <TabButton label="All" />
                      <TabButton label="Sativa" />
                      <TabButton label="Indica" />
                      <TabButton label="Hybrid" />
                    </div>
                 </div>
                 <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                    <TabButton label="All" />
                    <TabButton label="Sativa" />
                    <TabButton label="Indica" />
                    <TabButton label="Hybrid" />
                 </div>
            </div>

            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'flex flex-col gap-3'
            }>
                {filteredStrains.map(strain => renderStrain(strain))}
            </div>

            {!isLoading && filteredStrains.length === 0 && (
                <div className="text-center py-20 text-[var(--text-muted)] col-span-full">
                    <p className="font-bold text-lg text-[var(--text-main)]">No Strains Found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default StrainVerseDirectory;
