import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { LogoMark } from './Logo';

const SetupRequired: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div className="max-w-lg w-full rounded-2xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <LogoMark size="xl" className="mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">StrainVerse needs configuration</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Supabase environment variables are missing, so the app cannot connect to the database.
        </p>
        <div className="text-left rounded-xl border p-4 text-sm font-mono space-y-2 mb-6" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <p>NEXT_PUBLIC_SUPABASE_URL=your_project_url</p>
          <p>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key</p>
        </div>
        <p className="text-xs flex items-start gap-2 justify-center text-left" style={{ color: 'var(--text-muted)' }}>
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-yellow-500" />
          Copy <code className="text-[var(--text-secondary)]">.env.example</code> to <code className="text-[var(--text-secondary)]">.env.local</code>, fill in your Supabase credentials, then restart the dev server.
        </p>
      </div>
    </div>
  );
};

export default SetupRequired;
