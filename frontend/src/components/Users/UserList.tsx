import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { userService } from '../../services/userService';
import type { User } from '../../types';
import { UserForm } from './UserForm';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { PermissionRequestsPanel } from './PermissionRequestsPanel';

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch {
      toast.error('Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (id: string, role: User['role']) => {
    await userService.updateUser(id, { role });
    toast.success('Role updated');
    await loadUsers();
  };

  const handleStatusToggle = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    await userService.updateUser(user._id, { status: nextStatus });
    toast.success(`User ${nextStatus === 'active' ? 'activated' : 'deactivated'}`);
    await loadUsers();
  };

  const handleDeleteUser = async (user: User) => {
    const confirmDelete = window.confirm(`Delete user ${user.name} (${user.email})? This cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    try {
      await userService.deleteUser(user._id);
      toast.success('User deleted');
      await loadUsers();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? 'Could not delete user.'
        : 'Could not delete user.';
      toast.error(message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PermissionRequestsPanel />

      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="mt-1 text-sm text-slate-400">Admin-only control panel for roles and account status.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-2xl bg-brand-500 px-5 py-3 font-semibold text-white transition hover:bg-brand-400">
          Create User
        </button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-glow">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-4">Name</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-white/10 text-slate-200">
                <td className="px-4 py-4 font-medium text-white">{user.name}</td>
                <td className="px-4 py-4">{user.email}</td>
                <td className="px-4 py-4">
                  <select className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={user.role} onChange={(event) => handleRoleChange(user._id, event.target.value as User['role'])}>
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleStatusToggle(user)} className="text-sm font-semibold text-sky-300 transition hover:text-sky-200">
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDeleteUser(user)} className="text-sm font-semibold text-rose-300 transition hover:text-rose-200">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserForm
          onSubmit={async (data) => {
            try {
              await userService.createUser(data);
              toast.success('User created');
              setShowForm(false);
              await loadUsers();
            } catch (error) {
              const message = axios.isAxiosError(error)
                ? error.response?.data?.message ?? 'Could not create user.'
                : 'Could not create user.';
              toast.error(message);
            }
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
