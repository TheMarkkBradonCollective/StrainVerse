import React, { useState } from 'react';
import { Group, User } from '../types';
import { Users, Lock, Globe, PlusCircle, Flame } from 'lucide-react';
import CreateSeshModal from './CreateSeshModal';
import { api } from '../services/supabaseClient';

interface SocialSeshDirectoryProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  refreshGroups: () => Promise<void>;
  user: User;
}

const GroupCard: React.FC<{ group: Group; onSelect: () => void; }> = ({ group, onSelect }) => {
    return (
        <div onClick={onSelect} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.35rem] p-4 cursor-pointer hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cover bg-center rounded-2xl ring-2 ring-[var(--border)]" style={{backgroundImage: `url(${group.cover_image_url || 'https://source.unsplash.com/random/100x100/?abstract,texture&sig='+group.id})`}}></div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--text-main)] truncate">{group.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] truncate">{group.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] flex-shrink-0 bg-[var(--bg-input)] px-2.5 py-1 rounded-full">
                    {group.type === 'PUBLIC' ? <Globe size={14} /> : group.type === 'MATCH' ? <Flame size={14} className="text-orange-500" /> : <Lock size={14} />}
                    <span className="font-semibold">{group.type}</span>
                </div>
            </div>
        </div>
    )
}

const SocialSeshDirectory: React.FC<SocialSeshDirectoryProps> = ({ groups, onSelectGroup, refreshGroups, user }) => {
  const [activeTab, setActiveTab] = useState<'My Seshes' | 'Public'>('My Seshes');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const mySeshes = groups.filter(g => g.type === 'FRIEND' || g.type === 'FAMILY');
  const publicSeshes = groups.filter(g => g.type === 'PUBLIC');

  const seshesToShow = activeTab === 'My Seshes' ? mySeshes : publicSeshes;

  const handleCreateSesh = async (name: string, description: string, type: 'PUBLIC' | 'FRIEND' | 'FAMILY') => {
    await api.createGroup(name, description, type, user.id);
    await refreshGroups();
  };

  return (
    <div className="p-4 pb-20 lg:pb-4">
      {isCreateModalOpen && <CreateSeshModal onCreate={handleCreateSesh} onClose={() => setIsCreateModalOpen(false)} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-main)]">Social Seshes</h1>
          <p className="text-[var(--text-muted)] text-sm -mt-1">Your private and public smoke seshes.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white text-sm font-bold rounded-full hover:bg-[var(--accent-hover)] transition-colors shadow-[var(--shadow-color)]">
            <PlusCircle size={16} />
            Create Sesh
        </button>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)] mb-4">
        <button onClick={() => setActiveTab('My Seshes')} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'My Seshes' ? 'text-[var(--text-main)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
            My Seshes
        </button>
        <button onClick={() => setActiveTab('Public')} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'Public' ? 'text-[var(--text-main)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
            Public
        </button>
      </div>

      <div className="space-y-3">
        {seshesToShow.map(group => (
            <GroupCard key={group.id} group={group} onSelect={() => onSelectGroup(group.id)} />
        ))}
        {seshesToShow.length === 0 && (
            <div className="text-center py-20 text-[var(--text-muted)]">
                <p>No seshes here. Why not create one?</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SocialSeshDirectory;