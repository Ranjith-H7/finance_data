import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../utils/constants';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await authService.register({ name, email, password });
        refreshUser();
        toast.success('Account created');
      } else {
        await login(email, password);
        toast.success('Welcome back');
      }
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? error?.message ?? 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl sm:p-10">
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{APP_NAME}</h1>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-glow backdrop-blur-xl sm:p-10">
          <h2 className="text-2xl font-bold text-white">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login'
              ? 'Enter the email and password stored in the database.'
              : 'Create your own viewer account. You can sign in immediately after registration.'}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-brand-400" type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-brand-400" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-brand-400" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            <button disabled={loading} className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-100 transition hover:bg-white/10"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Self sign-up flow</p>
            <p className="mt-1">New users can register here and will be created as viewer accounts automatically.</p>
          </div>
          {mode === 'login' && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Manual login</p>
              <p className="mt-1">Type your account email and password directly.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
