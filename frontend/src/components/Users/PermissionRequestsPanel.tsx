import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { permissionService } from '../../services/permissionService';
import { userService } from '../../services/userService';
import type { PermissionRequest } from '../../types';
import type { User } from '../../types';

export function PermissionRequestsPanel() {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const [requestResult, userResult] = await Promise.all([
        permissionService.getAllRequests(),
        userService.getAllUsers(),
      ]);
      setRequests(requestResult);
      setUsers(userResult);
    } catch {
      toast.error('Could not load access requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setSavingId(id);
    try {
      await permissionService.reviewRequest(id, { status });
      toast.success(`Request ${status}`);
      await loadRequests();
    } catch {
      toast.error('Could not update request.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await permissionService.revokeRequest(id);
      toast.success('Access removed');
      await loadRequests();
    } catch {
      toast.error('Could not revoke access.');
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return null;
  }

  const userNameById = new Map(users.map((entry) => [entry._id, entry.name]));

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Permission manager</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Analyst access requests</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
          {requests.length} requests
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-400">No access requests yet.</p>
        ) : (
          requests.map((request) => (
            <article key={request._id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-white">Analyst: {userNameById.get(request.analystId) ?? request.analystId}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Scope: {request.scope}{request.userId ? ` · User: ${userNameById.get(request.userId) ?? request.userId}` : ''}
                  </p>
                  {request.reason && <p className="mt-2 text-sm text-slate-300">{request.reason}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : request.status === 'rejected' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {request.status}
                </span>
              </div>

              {request.status === 'pending' && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleReview(request._id, 'approved')}
                    disabled={savingId === request._id}
                    className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(request._id, 'rejected')}
                    disabled={savingId === request._id}
                    className="rounded-2xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              )}

              {request.status === 'approved' && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleRevoke(request._id)}
                    disabled={revokingId === request._id}
                    className="rounded-2xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {revokingId === request._id ? 'Revoking...' : 'Revoke access'}
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}