import { FormEvent, ReactNode, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Props = { children: ReactNode };
const fieldStyle = { width: '100%', padding: '13px 14px', border: '1px solid #cbd5e1', borderRadius: 12, fontSize: 16, outline: 'none', boxSizing: 'border-box' as const };

export function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!alive) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setPreview(false);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true); setError(''); setNotice('');
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authError) throw authError;
        setNotice(data.session ? 'Account created. Authentication is active.' : 'Check your email if confirmation is enabled, then sign in.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#0f766e' }}>Loading secure session…</div>;

  if (!isSupabaseConfigured || !supabase) {
    return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ width: 'min(100%, 520px)', background: 'white', padding: 28, borderRadius: 20, boxShadow: '0 18px 60px #0f172a12' }}>
        <div style={{ fontSize: 13, color: '#0f766e', fontWeight: 800, letterSpacing: 1 }}>M.S. MEDICAL STORE</div>
        <h1 style={{ fontSize: 27, margin: '10px 0' }}>Online setup required</h1>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>Shared online data needs a Supabase project. Add its URL and publishable/anon key to <code>.env.local</code>. Never add a service-role key to browser code.</p>
        <ol style={{ color: '#475569', lineHeight: 1.9, paddingLeft: 22 }}><li>Create a project.</li><li>Review and apply the SQL migration in <code>supabase/migrations</code> to a new test project.</li><li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li></ol>
        <p style={{ fontSize: 13, color: '#b45309' }}>Setup only: shared business data is not connected. Do not enter real patient or billing data.</p>
      </section>
    </main>;
  }

  if (session) {
    if (preview) return <>{children}<button onClick={signOut} style={{ position: 'fixed', top: 10, right: 12, zIndex: 1000, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 10, background: 'white', color: '#334155', fontSize: 12, fontWeight: 700 }}>Sign out</button></>;
    return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ width: 'min(100%, 520px)', background: 'white', padding: 28, borderRadius: 20, boxShadow: '0 18px 60px #0f172a12' }}>
        <div style={{ fontSize: 13, color: '#0f766e', fontWeight: 800, letterSpacing: 1 }}>M.S. MEDICAL STORE</div>
        <h1 style={{ fontSize: 26, margin: '10px 0' }}>Login successful</h1>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>Signed in as <strong>{session.user.email}</strong>.</p>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: 14, borderRadius: 12, color: '#9a3412', fontSize: 13, lineHeight: 1.6 }}>
          <strong>Important:</strong> Shared store-data sync is still being built. The existing dashboard uses browser-local demo storage and is not connected to the shared database. Do not use it for live billing or real customer data.
        </div>
        <button onClick={() => setPreview(true)} style={{ width: '100%', marginTop: 16, border: 0, borderRadius: 12, padding: 14, background: '#0f766e', color: 'white', fontWeight: 800 }}>Open prototype preview (demo data only)</button>
        <button onClick={signOut} style={{ width: '100%', marginTop: 10, padding: 12, background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, color: '#334155', fontWeight: 700 }}>Sign out</button>
      </section>
    </main>;
  }

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'linear-gradient(140deg, #ecfeff, #f8fafc 55%, #dcfce7)', fontFamily: 'system-ui, sans-serif' }}>
    <section style={{ width: 'min(100%, 420px)', background: 'white', padding: 28, borderRadius: 22, boxShadow: '0 20px 70px #0f172a16' }}>
      <div style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#ccfbf1', color: '#0f766e', fontSize: 27 }}>✚</div>
      <p style={{ color: '#0f766e', fontWeight: 800, letterSpacing: 1, fontSize: 12, marginBottom: 4 }}>M.S. MEDICAL STORE</p>
      <h1 style={{ fontSize: 27, margin: '8px 0' }}>{mode === 'signin' ? 'Welcome back' : 'Create store login'}</h1>
      <p style={{ color: '#64748b', marginTop: 0, lineHeight: 1.5 }}>Secure account access for your medical-store workspace.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@example.com" style={{ ...fieldStyle, marginTop: 6 }} /></label>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Password<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ ...fieldStyle, marginTop: 6 }} /></label>
        {error && <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>{error}</p>}
        {notice && <p role="status" style={{ margin: 0, color: '#047857', fontSize: 13 }}>{notice}</p>}
        <button disabled={submitting} style={{ border: 0, borderRadius: 12, padding: 14, background: submitting ? '#64748b' : '#0f766e', color: 'white', fontWeight: 800, fontSize: 15 }}>{submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); }} style={{ width: '100%', marginTop: 14, padding: 10, background: 'transparent', border: 0, color: '#0f766e', fontWeight: 700 }}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
      <p style={{ marginBottom: 0, color: '#94a3b8', fontSize: 11, lineHeight: 1.5 }}>Authentication foundation only. Shared data sync and production billing are not ready yet.</p>
    </section>
  </main>;
}
