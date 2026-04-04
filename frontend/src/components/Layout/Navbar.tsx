import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import { permissionService } from '../../services/permissionService';
import type { PermissionRequest } from '../../types';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [latestRequest, setLatestRequest] = useState<PermissionRequest | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPermissionState = async () => {
      if (!user) {
        setLatestRequest(null);
        setPendingCount(0);
        return;
      }

      try {
        if (user.role === 'analyst') {
          const requests = await permissionService.getMyRequests();
          setLatestRequest(requests[0] ?? null);
        } else if (user.role === 'admin') {
          const requests = await permissionService.getAllRequests();
          setPendingCount(requests.filter((request) => request.status === 'pending').length);
        }
      } catch {
        setLatestRequest(null);
        setPendingCount(0);
      }
    };

    loadPermissionState();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500/20 text-brand-200 shadow-glow">
            <span className="text-lg font-black">₹</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">Finance control center</p>
            <h1 className="text-lg font-semibold tracking-tight text-white">{ROLE_LABELS[user?.role ?? 'viewer']}</h1>
          </div>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          <Link className="text-sm font-medium text-slate-300 transition hover:text-white" to="/dashboard">Dashboard</Link>
          {user?.role !== 'viewer' && (
            <Link className="text-sm font-medium text-slate-300 transition hover:text-white" to="/finance">Finance</Link>
          )}
          {user?.role === 'admin' && (
            <Link className="text-sm font-medium text-slate-300 transition hover:text-white" to="/users">Users</Link>
          )}
          {user?.role === 'analyst' && latestRequest && (
            <div className={`hidden rounded-full border px-4 py-2 text-xs font-semibold md:block ${latestRequest.status === 'approved' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : latestRequest.status === 'rejected' ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'}`}>
              Access {latestRequest.status}
            </div>
          )}
          {user?.role === 'admin' && pendingCount > 0 && (
            <div className="hidden rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-200 md:block">
              {pendingCount} pending approvals
            </div>
          )}
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 md:block">
            {user?.name} · {user?.role}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
