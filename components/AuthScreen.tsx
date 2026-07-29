import React, { useState } from 'react';
import { auth, api, formatSupabaseError } from '../services/supabaseClient';
import { Loader2, ChevronRight } from 'lucide-react';
import { LogoMark } from './Logo';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await auth.signIn(email, password);
        if (error) throw error;
        const user = await api.getCurrentUser();
        if (!user) {
          throw new Error('Signed in but could not load your profile. Please try again.');
        }
      } else {
        if (!name || !handle || !dob) {
          throw new Error("Please fill out all fields.");
        }
        const { error } = await auth.signUp(email, password, name, handle, dob);
        if (error) throw error;
        const user = await api.getCurrentUser();
        if (!user) {
          throw new Error('Account created but could not load your profile. Try signing in.');
        }
      }
      onSuccess();
    } catch (err: any) {
      const msg = err.message || formatSupabaseError(err) || "An error occurred";
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. If you signed up on Cookbook or SpiritsVerse, use the same credentials here.');
      } else if (msg.toLowerCase().includes('already registered')) {
        setError('This email is already registered on Cookbook or another Verse app. Sign in with your existing password.');
        setIsLogin(true);
      } else if (msg.toLowerCase().includes('could not create your strainverse profile') || msg.toLowerCase().includes('could not load your profile')) {
        setError(`${msg} Run sql/complete-setup.sql in Supabase, then sign in again — your Verse password works here too.`);
      } else if (
        msg.toLowerCase().includes('schema cache') ||
        msg.toLowerCase().includes('repair_postgrest_schemas') ||
        msg.toLowerCase().includes('invalid schema') ||
        msg.toLowerCase().includes('complete-setup.sql')
      ) {
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--text-main)] text-sm focus:border-[var(--accent)] outline-none transition-colors placeholder-[var(--text-muted)]/40';

  return (
    <div className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.75rem] shadow-[var(--shadow-soft)] relative z-10 overflow-hidden">
      <div className="p-8 text-center border-b border-[var(--border)] bg-[var(--hybrid-mist)]/50">
        <LogoMark size="xl" className="mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-[var(--text-main)] mb-1 tracking-tight">
          Welcome to StrainVerse
        </h1>
        <p className="text-[var(--text-muted)] text-sm font-medium">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
        <p className="text-[var(--text-muted)] text-xs mt-2">
          One Verse account works across Cookbook, StrainVerse, and SpiritsVerse.
        </p>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-xs text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1.5">Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Smith"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1.5">Handle</label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="@alex"
                    className={inputClass}
                  />
                </div>
              </div>
               <div>
                <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3.5 rounded-full shadow-[var(--shadow-color)] transition-all active:scale-[0.98] flex items-center justify-between gap-2 mt-6 pl-6 pr-2"
          >
            <span className="flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Sign In' : 'Create Account')}
            </span>
            <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight size={18} />
            </span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[var(--accent)] hover:underline font-semibold transition-colors"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
