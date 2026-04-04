import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { financeService, type FinanceRecordFilters } from '../../services/financeService';
import { permissionService } from '../../services/permissionService';
import { userService } from '../../services/userService';
import type { DashboardAnalytics, FinanceRecord as FinanceRecordType, User } from '../../types';
import { FinanceForm } from './FinanceForm';
import { FinanceRecord } from './FinanceRecord';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { PermissionRequestCard } from '../Common/PermissionRequestCard';

export function FinanceList() {
  const { user } = useAuth();
  const [records, setRecords] = useState<FinanceRecordType[]>([]);
  const [analystAnalytics, setAnalystAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecordType | null>(null);
  const [hasAccess, setHasAccess] = useState(user?.role !== 'analyst');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserResults, setSelectedUserResults] = useState<User[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [autoRefreshTick, setAutoRefreshTick] = useState(0);
  const [analystApprovedUsers, setAnalystApprovedUsers] = useState<User[]>([]);
  const [analystSelectedUserId, setAnalystSelectedUserId] = useState('all');
  const [hasAnalystAllUsersAccess, setHasAnalystAllUsersAccess] = useState(false);

  const canManage = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst';
  const canFilter = canManage || isAnalyst;
  const usersById = useMemo(() => new Map(users.map((item) => [item._id, item])), [users]);
  const categories = useMemo(() => Array.from(new Set(records.map((entry) => entry.category))).sort(), [records]);
  const analystSummary = analystAnalytics?.summary ?? {
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    totalRecords: 0,
    totalUsers: 0,
  };
  const analystCategoryBreakdown = useMemo(() => {
    const categories = [...(analystAnalytics?.byCategory ?? [])]
      .sort((first, second) => second.totalAmount - first.totalAmount)
      .slice(0, 6);
    const maxAmount = categories[0]?.totalAmount ?? 0;

    return categories.map((entry) => ({
      category: entry._id,
      amount: entry.totalAmount,
      percentage: maxAmount > 0 ? Math.max((entry.totalAmount / maxAmount) * 100, 8) : 0,
    }));
  }, [analystAnalytics]);
  const analystMonthlyTrend = useMemo(() => {
    const ordered = [...(analystAnalytics?.monthlyTrends ?? [])]
      .sort((first, second) => {
        if (first.year !== second.year) {
          return first.year - second.year;
        }

        return first.month - second.month;
      })
      .slice(-6)
      .map((entry) => ({
        month: new Date(entry.year, entry.month - 1).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        income: entry.income,
        expense: entry.expense,
        net: entry.net,
      }));

    const maxValue = ordered.reduce((maximum, entry) => {
      return Math.max(maximum, entry.income, entry.expense);
    }, 0);

    return ordered.map((entry) => ({
      ...entry,
      incomePercentage: maxValue > 0 ? Math.max((entry.income / maxValue) * 100, 6) : 0,
      expensePercentage: maxValue > 0 ? Math.max((entry.expense / maxValue) * 100, 6) : 0,
    }));
  }, [analystAnalytics]);

  const financeQuery: FinanceRecordFilters = useMemo(() => {
    return {
      userId: canManage
        ? (selectedUserId !== 'all' ? selectedUserId : undefined)
        : (isAnalyst && analystSelectedUserId !== 'all' ? analystSelectedUserId : undefined),
      type: typeFilter !== 'all' ? typeFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    };
  }, [canManage, selectedUserId, isAnalyst, analystSelectedUserId, typeFilter, categoryFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    const loadUsers = async () => {
      if (user?.role !== 'admin') {
        return;
      }

      try {
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
      } catch {
        toast.error('Could not load users for filtering.');
      }
    };

    loadUsers();
  }, [user]);

  useEffect(() => {
    if (!canManage) {
      setSelectedUserResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const query = userSearch.trim();

      if (!query) {
        setSelectedUserResults([]);
        return;
      }

      try {
        const results = await userService.searchUsers(query);
        setSelectedUserResults(results);
      } catch {
        setSelectedUserResults([]);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [canManage, userSearch]);

  const canEditRecord = useMemo(() => {
    return (record: FinanceRecordType) => {
      if (!user) {
        return false;
      }
      return user.role === 'admin';
    };
  }, [user]);

  const canDeleteRecord = useMemo(() => {
    return (record: FinanceRecordType) => {
      if (!user) {
        return false;
      }
      return user.role === 'admin';
    };
  }, [user]);

  useEffect(() => {
    const loadAnalystScopes = async () => {
      if (!isAnalyst) {
        setAnalystApprovedUsers([]);
        setAnalystSelectedUserId('all');
        setHasAnalystAllUsersAccess(false);
        return;
      }

      try {
        const permissions = await permissionService.getMyRequests();
        const approvedRequests = permissions.filter((item) => item.status === 'approved');
        const hasApprovedAccess = approvedRequests.length > 0;

        setHasAccess(hasApprovedAccess);

        if (!hasApprovedAccess) {
          setAnalystApprovedUsers([]);
          setAnalystSelectedUserId('all');
          setHasAnalystAllUsersAccess(false);
          return;
        }

        const hasAllUsers = approvedRequests.some((item) => item.scope === 'all_users');
        const singleUserIds = Array.from(new Set(
          approvedRequests
            .filter((item) => item.scope === 'single_user' && item.userId)
            .map((item) => item.userId as string)
        ));

        const resolvedUsers = (await Promise.all(
          singleUserIds.map(async (id) => {
            const matchedUsers = await userService.searchUsers(id);
            return matchedUsers[0] ?? null;
          })
        )).filter((item): item is User => item !== null);

        setAnalystApprovedUsers(resolvedUsers);
        setHasAnalystAllUsersAccess(hasAllUsers);
        setAnalystSelectedUserId((currentValue) => {
          if (hasAllUsers && (currentValue === 'all' || resolvedUsers.some((entry) => entry._id === currentValue))) {
            return currentValue;
          }

          if (resolvedUsers.some((entry) => entry._id === currentValue)) {
            return currentValue;
          }

          if (resolvedUsers.length > 0) {
            return resolvedUsers[0]._id;
          }

          return 'all';
        });
      } catch {
        setHasAccess(false);
        setAnalystApprovedUsers([]);
        setAnalystSelectedUserId('all');
        setHasAnalystAllUsersAccess(false);
      }
    };

    loadAnalystScopes();
  }, [isAnalyst, autoRefreshTick]);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        if (isAnalyst && !hasAccess) {
          setRecords([]);
          setAnalystAnalytics(null);
          return;
        }

        const [data, analyticsData] = await Promise.all([
          financeService.getAllRecords(financeQuery),
          isAnalyst ? financeService.getDashboardAnalytics(financeQuery) : Promise.resolve(null),
        ]);
        setRecords(data);
        if (isAnalyst) {
          setAnalystAnalytics(analyticsData);
        }
      } catch (error) {
        if (isAnalyst) {
          setHasAccess(false);
          setAnalystAnalytics(null);
        } else {
          toast.error('Could not load finance records.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
  }, [user, isAnalyst, hasAccess, financeQuery, autoRefreshTick]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAutoRefreshTick((value) => value + 1);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const refresh = async () => {
    const [data, analyticsData] = await Promise.all([
      financeService.getAllRecords(financeQuery),
      isAnalyst && hasAccess ? financeService.getDashboardAnalytics(financeQuery) : Promise.resolve(null),
    ]);

    setRecords(data);

    if (isAnalyst) {
      setAnalystAnalytics(analyticsData);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Delete this record?');
    if (!confirmDelete) {
      return;
    }

    await financeService.deleteRecord(id);
    toast.success('Record deleted');
    await refresh();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAnalyst && !hasAccess) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white">Financial Records</h2>
          <p className="mt-2 text-sm text-slate-400">Analysts need approved data access before the record list becomes visible.</p>
        </div>

        <PermissionRequestCard
          title="Request analyst access"
          description="Request approval for all-user finance data or a single-user scope. Once approved, the records table will unlock automatically."
          onRequested={async () => {
            await refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Financial Records</h2>
          <p className="mt-1 text-sm text-slate-400">Admins manage records. Analysts can view approved data only.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {canManage && (
            <div className="grid gap-2">
              <input
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand-400"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search user by name or email"
              />
              {userSearch.trim() && selectedUserResults.length > 0 && (
                <div className="max-h-56 overflow-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-glow">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId('all');
                      setUserSearch('');
                      setSelectedUserResults([]);
                    }}
                    className="mb-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    All users
                  </button>
                  {selectedUserResults.map((item) => (
                    <button
                      type="button"
                      key={item._id}
                      onClick={() => {
                        setSelectedUserId(item._id);
                        setUserSearch(`${item.name} (${item.email})`);
                        setSelectedUserResults([]);
                      }}
                      className="mb-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {isAnalyst && (hasAnalystAllUsersAccess || analystApprovedUsers.length > 0) && (
            <div className="grid gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">Approved Scope</p>
              <select
                value={analystSelectedUserId}
                onChange={(event) => setAnalystSelectedUserId(event.target.value)}
                className="rounded-xl border border-cyan-400/30 bg-slate-950/80 px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-300"
              >
                {hasAnalystAllUsersAccess && <option value="all">All approved users</option>}
                {analystApprovedUsers.map((entry) => (
                  <option key={entry._id} value={entry._id}>{entry.name} ({entry.email})</option>
                ))}
              </select>
            </div>
          )}
          {canManage && (
            <button onClick={() => setShowForm(true)} className="rounded-2xl bg-brand-500 px-5 py-3 font-semibold text-white transition hover:bg-brand-400">
              Add Record
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-glow">
        {canFilter && (
          <div className="grid gap-3 border-b border-white/10 bg-white/5 p-4 sm:grid-cols-4">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | 'income' | 'expense')} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-brand-400">
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-brand-400">
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input value={startDateFilter} onChange={(event) => setStartDateFilter(event.target.value)} type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-brand-400" />
            <input value={endDateFilter} onChange={(event) => setEndDateFilter(event.target.value)} type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-brand-400" />
          </div>
        )}
        {!isAnalyst && (
          <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-4">Date</th>
              {(canManage || (isAnalyst && analystSelectedUserId === 'all')) && <th className="px-4 py-4">User</th>}
              <th className="px-4 py-4">Details</th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">Amount</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <FinanceRecord
                key={record._id}
                record={record}
                canEdit={canEditRecord(record)}
                canDelete={canDeleteRecord(record)}
                onEdit={(entry) => setEditingRecord(entry)}
                onDelete={handleDelete}
                showOwner={canManage || (isAnalyst && analystSelectedUserId === 'all')}
                ownerLabel={typeof record.userId === 'string' ? (usersById.get(record.userId)?.name ?? record.userId) : record.userId}
              />
            ))}
          </tbody>
          </table>
        )}

        {isAnalyst && (
          <div className="space-y-6 p-4 sm:p-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Income</p>
                <p className="mt-2 text-2xl font-bold text-emerald-100">₹{analystSummary.totalIncome.toLocaleString('en-IN')}</p>
              </article>
              <article className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-rose-200/80">Expense</p>
                <p className="mt-2 text-2xl font-bold text-rose-100">₹{analystSummary.totalExpense.toLocaleString('en-IN')}</p>
              </article>
              <article className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Net</p>
                <p className="mt-2 text-2xl font-bold text-cyan-100">₹{analystSummary.netBalance.toLocaleString('en-IN')}</p>
              </article>
              <article className="rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-200/80">Records</p>
                <p className="mt-2 text-2xl font-bold text-indigo-100">{analystSummary.totalRecords}</p>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Category Trend</h3>
                <div className="mt-4 grid gap-3">
                  {analystCategoryBreakdown.length === 0 ? (
                    <p className="text-sm text-slate-400">No records for selected filters.</p>
                  ) : analystCategoryBreakdown.map((entry) => (
                    <div key={entry.category}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                        <span>{entry.category}</span>
                        <span>₹{entry.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${entry.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-indigo-400/20 bg-slate-950/70 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-200">Monthly Flow</h3>
                <div className="mt-4 grid gap-3">
                  {analystMonthlyTrend.length === 0 ? (
                    <p className="text-sm text-slate-400">No monthly data for selected filters.</p>
                  ) : analystMonthlyTrend.map((entry) => (
                    <div key={entry.month} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>{entry.month}</span>
                        <span className={entry.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}>₹{entry.net.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${entry.incomePercentage}%` }} />
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-rose-400" style={{ width: `${entry.expensePercentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-3">
              {records.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">No records for selected filters.</p>
              ) : records.map((record) => (
                <article key={record._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="mt-1 text-base font-semibold text-white">{record.description ?? record.note ?? record.category}</p>
                      <p className="mt-1 text-sm text-slate-400">{record.merchant ?? 'No merchant'} · {record.category}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.type === 'income' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                        {record.type}
                      </span>
                      <p className={`mt-2 text-lg font-bold ${record.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {record.type === 'income' ? '+' : '-'}₹{record.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </div>

      {user?.role === 'analyst' && (
        <PermissionRequestCard
          title="Need a different scope?"
          description="Request all-user access or a single-user scope if your work changes. Admin approval is required before the new scope is active."
          onRequested={refresh}
        />
      )}

      {showForm && (
        <FinanceForm
          onSubmit={async (data) => {
            await financeService.createRecord(data);
            toast.success('Record created');
            setShowForm(false);
            await refresh();
          }}
          onClose={() => setShowForm(false)}
          showUserSelector={canManage}
          users={users}
          selectedUserId={selectedUserId}
        />
      )}

      {editingRecord && (
        <FinanceForm
          initialData={editingRecord}
          onSubmit={async (data) => {
            await financeService.updateRecord(editingRecord._id, data);
            toast.success('Record updated');
            setEditingRecord(null);
            await refresh();
          }}
          onClose={() => setEditingRecord(null)}
          showUserSelector={canManage}
          users={users}
          selectedUserId={selectedUserId}
        />
      )}
    </div>
  );
}
