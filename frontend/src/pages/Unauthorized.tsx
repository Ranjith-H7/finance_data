import { Link } from 'react-router-dom';

export function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center shadow-glow backdrop-blur-xl">
          <p className="text-7xl font-black text-rose-300">403</p>
          <h1 className="mt-4 text-3xl font-bold">Access denied</h1>
          <p className="mt-3 text-slate-400">Your role does not permit this page.</p>
          <Link to="/dashboard" className="mt-8 inline-flex rounded-2xl bg-brand-500 px-5 py-3 font-semibold text-white transition hover:bg-brand-400">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
