import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { permissionService } from '../../services/permissionService';
import { userService } from '../../services/userService';
import type { PermissionRequest, PermissionScope } from '../../types';
import type { User } from '../../types';

interface PermissionRequestCardProps {
  title: string;
  description: string;
  onRequested?: () => void;
}

export function PermissionRequestCard({ title, description, onRequested }: PermissionRequestCardProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [scope, setScope] = useState<PermissionScope>('all_users');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUser) {
      return '';
    }

    return `${selectedUser.name} (${selectedUser.email})`;
  }, [selectedUser]);

  useEffect(() => {
    if (!user || user.role !== 'analyst') {
      return;
    }

    const loadRequests = async () => {
      try {
        const result = await permissionService.getMyRequests();
        setRequests(result);
      } catch {
        setRequests([]);
      }
    };

    loadRequests();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'analyst' || scope !== 'single_user') {
      setSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const query = userSearch.trim();

      if (!query) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await userService.searchUsers(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [user, scope, userSearch]);

  useEffect(() => {
    if (scope === 'all_users') {
      setUserSearch('');
      setSelectedUser(null);
      setSearchResults([]);
    }
  }, [scope]);

  if (!user || user.role !== 'analyst') {
    return null;
  }

  const latestRequest = requests[0];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (scope === 'single_user' && !selectedUser) {
      toast.error('Please select a user from search results before requesting access');
      return;
    }

    setIsSubmitting(true);
    try {
      await permissionService.requestAccess({
        scope,
        userId: scope === 'single_user' ? selectedUser?._id : undefined,
        reason,
      });
      toast.success('Access request submitted');
      setReason('');
      if (scope === 'single_user') {
        setUserSearch('');
        setSelectedUser(null);
        setSearchResults([]);
      }
      const updatedRequests = await permissionService.getMyRequests();
      setRequests(updatedRequests);
      onRequested?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Could not submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Analyst access</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {latestRequest && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${latestRequest.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : latestRequest.status === 'rejected' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>
            {latestRequest.status}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300">
            Access scope
            <select
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-400"
              value={scope}
              onChange={(event) => setScope(event.target.value as PermissionScope)}
            >
              <option value="all_users">All users</option>
              <option value="single_user">Single user</option>
            </select>
          </label>

          {scope === 'single_user' ? (
            <div className="grid gap-2 text-sm text-slate-300 sm:col-span-2">
              <label className="grid gap-2 text-sm text-slate-300">
                Search user
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-brand-400"
                  value={userSearch}
                  onChange={(event) => {
                    setUserSearch(event.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="Search by name or email"
                  required
                />
              </label>

              <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                {selectedUser ? (
                  <p>Selected: {selectedUserLabel}</p>
                ) : isSearching ? (
                  <p>Searching...</p>
                ) : searchResults.length > 0 ? (
                  <div className="grid gap-2">
                    {searchResults.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(item);
                          setUserSearch(`${item.name} ${item.email}`);
                          setSearchResults([]);
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.email}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">Type at least one name or email fragment to find a user.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-400">
              Request access to all user records in approved dashboard and finance views.
            </div>
          )}
        </div>

        <label className="grid gap-2 text-sm text-slate-300">
          Reason
          <textarea
            className="min-h-24 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-brand-400"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Describe why you need this access"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-3 font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Request access'}
        </button>
      </form>
    </section>
  );
}