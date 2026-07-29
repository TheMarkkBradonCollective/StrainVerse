import React from 'react';
import { AppView, User } from '../types';
import { LogOut } from 'lucide-react';
import { getVisibleNavItems } from '../navConfig';
import Logo from './Logo';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  user: User;
  onSignOut: () => void;
  userAge: number | null;
}

const NavLink: React.FC<{ icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center w-full gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 ${
        isActive
          ? 'bg-[var(--accent)] text-white font-bold shadow-[var(--shadow-color)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      <span>{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onSignOut, userAge }) => {
  const visibleNavItems = getVisibleNavItems(userAge);

  return (
    <aside className="w-64 h-screen sticky top-0 border-r border-[var(--border)] p-4 flex-col justify-between hidden lg:flex bg-[var(--bg-card)]/70 backdrop-blur-xl">
      <div>
        <div className="mb-8 px-2 pt-2">
            <Logo />
        </div>

        <nav className="space-y-1.5">
            {visibleNavItems.map(item => (
                <NavLink
                  key={item.view}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentView === item.view}
                  onClick={() => setView(item.view)}
                />
            ))}
        </nav>
      </div>
      
      <div className="border-t border-[var(--border)] pt-4">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-[var(--bg-input)]/60">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border)]" />
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-[var(--text-main)]">{user.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">@{user.handle}</p>
            </div>
            <button onClick={onSignOut} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)] rounded-xl transition-colors">
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
