import { useEffect, useMemo, useState } from 'react';
import { financeService } from '../../services/financeService';
import type { DashboardAnalytics } from '../../types';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { SummaryCards } from './SummaryCards';
import { CategoryBreakdown } from './CategoryBreakdown';
import { MonthlyTrends } from './MonthlyTrends';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionRequestCard } from '../Common/PermissionRequestCard';
import { PermissionRequestsPanel } from '../Users/PermissionRequestsPanel';
import { permissionService } from '../../services/permissionService';
import { userService } from '../../services/userService';
import type { User } from '../../types';
import toast from 'react-hot-toast';

export function Dashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [adminSearchResults, setAdminSearchResults] = useState<User[]>([]);
  const [adminSearching, setAdminSearching] = useState(false);
  const [analystApprovedUsers, setAnalystApprovedUsers] = useState<User[]>([]);
  const [analystSelectedUserId, setAnalystSelectedUserId] = useState('all');
  const [hasAnalystAllUsersAccess, setHasAnalystAllUsersAccess] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const { user } = useAuth();

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    if (!search) {
      return users;
    }

    return users.filter((item) => {
      return (
        item.name.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search)
      );
    });
  }, [users, userSearch]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const scopeUserId = user?.role === 'analyst'
          ? (analystSelectedUserId !== 'all' ? analystSelectedUserId : undefined)
          : (selectedUserId !== 'all' ? selectedUserId : undefined);
        const result = await financeService.getDashboardAnalytics(
          scopeUserId ? { userId: scopeUserId } : undefined
        );
        setAnalytics(result);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedUserId, user, analystSelectedUserId, refreshTick]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadAnalystScope = async () => {
      if (user?.role !== 'analyst') {
        setAnalystApprovedUsers([]);
        setAnalystSelectedUserId('all');
        setHasAnalystAllUsersAccess(false);
        return;
      }

      try {
        const requests = await permissionService.getMyRequests();
        const approvedRequests = requests.filter((item) => item.status === 'approved');
        const hasAllUsersAccess = approvedRequests.some((item) => item.scope === 'all_users');
        const approvedSingleUserIds = Array.from(new Set(
          approvedRequests
            .filter((item) => item.scope === 'single_user' && item.userId)
            .map((item) => item.userId as string)
        ));

        const resolvedUsers = (await Promise.all(
          approvedSingleUserIds.map(async (id) => {
            const matchedUsers = await userService.searchUsers(id);
            return matchedUsers[0] ?? null;
          })
        )).filter((item): item is User => item !== null);

        setAnalystApprovedUsers(resolvedUsers);
        setHasAnalystAllUsersAccess(hasAllUsersAccess);
        setAnalystSelectedUserId((prevSelected) => {
          if (hasAllUsersAccess && (prevSelected === 'all' || resolvedUsers.some((entry) => entry._id === prevSelected))) {
            return prevSelected;
          }

          if (resolvedUsers.some((entry) => entry._id === prevSelected)) {
            return prevSelected;
          }

          if (resolvedUsers.length > 0) {
            return resolvedUsers[0]._id;
          }

          return 'all';
        });
      } catch {
        setAnalystApprovedUsers([]);
        setAnalystSelectedUserId('all');
        setHasAnalystAllUsersAccess(false);
      }
    };

    loadAnalystScope();
  }, [user]);

  useEffect(() => {
    const loadUsers = async () => {
      if (user?.role !== 'admin') {
        return;
      }

      try {
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
      } catch {
        toast.error('Could not load users for dashboard filter.');
      }
    };

    loadUsers();
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setAdminSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const query = userSearch.trim();

      if (!query) {
        setAdminSearchResults([]);
        return;
      }

      setAdminSearching(true);
      try {
        const results = await userService.searchUsers(query);
        setAdminSearchResults(results);
      } catch {
        setAdminSearchResults([]);
      } finally {
        setAdminSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [user, userSearch]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!analytics) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">No analytics available.</div>;
  }

  const isViewer = user?.role === 'viewer';
  const isAnalyst = user?.role === 'analyst';
  const canSeeUserBreakdown = isAnalyst;
  const selectedAnalystUser = analystApprovedUsers.find((entry) => entry._id === analystSelectedUserId) ?? null;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl">
          <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Role-based finance control
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Clear finance data, strict permissions, and instant analytics.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            The dashboard adapts to your role. Admins manage the system, analysts work with approved records and insights,
            and viewers get a clean read-only view of the global overview.
          </p>
          {user && (
            <div className="mt-4 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
              Signed in: {user.name} ({user.email})
            </div>
          )}
          {user?.role === 'analyst' && (
            <div className="mt-4 grid gap-2">
              {(hasAnalystAllUsersAccess || analystApprovedUsers.length > 0) ? (
                <>
                  <label className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/80">Approved Scope</label>
                  <select
                    className="w-full rounded-xl border border-cyan-400/20 bg-slate-950/60 px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-300"
                    value={analystSelectedUserId}
                    onChange={(event) => setAnalystSelectedUserId(event.target.value)}
                  >
                    {hasAnalystAllUsersAccess && <option value="all">All approved users</option>}
                    {analystApprovedUsers.map((entry) => (
                      <option key={entry._id} value={entry._id}>{entry.name} ({entry.email})</option>
                    ))}
                  </select>
                  {selectedAnalystUser && (
                    <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      Viewing: {selectedAnalystUser.name} ({selectedAnalystUser.email})
                    </div>
                  )}
                  {analystSelectedUserId === 'all' && hasAnalystAllUsersAccess && (
                    <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      Viewing: All approved users
                    </div>
                  )}
                </>
              ) : (
                <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                  Waiting for admin approval to unlock analyst dashboard data
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-4">
          {user?.role === 'admin' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
              <p className="text-sm text-slate-400">Dashboard Scope</p>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand-400"
                placeholder="Search user by name or email"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
              {userSearch.trim() && (
                <div className="mt-2 max-h-52 overflow-auto rounded-xl border border-white/10 bg-slate-950/95 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId('all');
                      setUserSearch('');
                      setAdminSearchResults([]);
                    }}
                    className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    All users
                  </button>
                  {adminSearching ? (
                    <p className="px-3 py-2 text-xs text-slate-400">Searching...</p>
                  ) : adminSearchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-500">No users matched this search.</p>
                  ) : (
                    adminSearchResults.map((item) => (
                      <button
                        type="button"
                        key={item._id}
                        onClick={() => {
                          setSelectedUserId(item._id);
                          setUserSearch(`${item.name} (${item.email})`);
                          setAdminSearchResults([]);
                        }}
                        className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.email}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-brand-400"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                <option value="all">All users</option>
                {filteredUsers.map((item) => (
                  <option key={item._id} value={item._id}>{item.name} ({item.email})</option>
                ))}
              </select>
            </div>
          )}
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
            <p className="text-sm text-slate-400">Net Balance</p>
            <p className="mt-2 text-3xl font-bold text-white">₹{analytics.summary.netBalance.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
            <p className="text-sm text-slate-400">Recent Records</p>
            <p className="mt-2 text-3xl font-bold text-white">{analytics.summary.totalRecords}</p>
          </div>
        </div>
      </section>

      {isAnalyst && (
        <PermissionRequestCard
          title={analytics.permissionRequired ? 'Permission required' : 'Request more access'}
          description={analytics.permissionRequired
            ? 'Analysts must request approval before raw records become visible. Choose a scope and submit it for admin review.'
            : 'You already have some access. Submit another request if you need a different scope or a single-user view.'}
          onRequested={async () => {
            const result = await financeService.getDashboardAnalytics(
              analystSelectedUserId !== 'all' ? { userId: analystSelectedUserId } : undefined
            );
            setAnalytics(result);
          }}
        />
      )}

      {user?.role === 'admin' && <PermissionRequestsPanel />}

      <SummaryCards summary={analytics.summary} />

      {canSeeUserBreakdown && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Accessible users</h3>
              <p className="text-sm text-slate-400">Names, emails, and amount aggregation for the current dashboard scope</p>
            </div>
            <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-300">
              {analytics.userBreakdown.length} users
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {analytics.userBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400">No user-level data available for this scope.</p>
            ) : analytics.userBreakdown.map((item) => (
              <article key={item.userId} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-slate-400">{item.email}</p>
                  </div>
                  <p className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                    {item.totalRecords} records
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <div>
                    <p className="text-slate-500">Sum</p>
                    <p className="mt-1 font-semibold text-white">₹{item.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Average</p>
                    <p className="mt-1 font-semibold text-white">₹{item.averageAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Min</p>
                    <p className="mt-1 font-semibold text-emerald-300">₹{item.minAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Max</p>
                    <p className="mt-1 font-semibold text-rose-300">₹{item.maxAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {isViewer ? (
        <section className="rounded-3xl border border-sky-300/20 bg-sky-400/5 p-6 shadow-glow backdrop-blur-xl">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Viewer Charts</h3>
            <p className="text-sm text-slate-300">
              Monthly and category-wise charts for read-only monitoring.
            </p>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <CategoryBreakdown data={analytics.byCategory} />
            <MonthlyTrends data={analytics.monthlyTrends} />
          </div>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <CategoryBreakdown data={analytics.byCategory} />
          <MonthlyTrends data={analytics.monthlyTrends} />
        </div>
      )}

      {!isViewer && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Highest spending users</h3>
            <div className="mt-4 grid gap-3">
              {analytics.topSpenders.length === 0 ? (
                <p className="text-sm text-slate-400">No spending data available.</p>
              ) : analytics.topSpenders.map((item) => (
                <div key={item.userId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-slate-400">{item.email}</p>
                  </div>
                  <p className="font-semibold text-rose-300">₹{item.totalExpense.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Lowest spending users</h3>
            <div className="mt-4 grid gap-3">
              {analytics.lowestSpenders.length === 0 ? (
                <p className="text-sm text-slate-400">No spending data available.</p>
              ) : analytics.lowestSpenders.map((item) => (
                <div key={item.userId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-slate-400">{item.email}</p>
                  </div>
                  <p className="font-semibold text-emerald-300">₹{item.totalExpense.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {!isViewer && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <div className="mt-4 grid gap-3">
            {analytics.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400">No recent records available.</p>
            ) : analytics.recentActivity.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
                <div>
                  <p className="font-medium text-white">{item.description ?? item.note ?? item.category}</p>
                  <p className="text-slate-400">{item.category} · {item.type}</p>
                  {(item.userName || item.userEmail) && (
                    <p className="text-xs text-cyan-200/90">{item.userName ?? 'Unknown user'}{item.userEmail ? ` (${item.userEmail})` : ''}</p>
                  )}
                </div>
                <p className={`font-semibold ${item.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isViewer && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl text-slate-300">
          <h3 className="text-lg font-semibold text-white">Global overview only</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Viewers can read the dashboard summaries, trends, and spending rankings, but raw transaction rows stay hidden.
          </p>
        </section>
      )}
    </div>
  );
}
