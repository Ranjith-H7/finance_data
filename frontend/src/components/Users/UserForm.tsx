import { useState } from 'react';
import type { User } from '../../types';

interface UserFormProps {
  onSubmit: (data: { name: string; email: string; password: string; role: User['role']; status: User['status'] }) => Promise<void>;
  onClose: () => void;
}

export function UserForm({ onSubmit, onClose }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as User['role'],
    status: 'active' as User['status'],
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-glow sm:p-8">
        <h2 className="text-2xl font-bold text-white">Create User</h2>
        <p className="mt-2 text-sm text-slate-400">Admin-only account provisioning for analyst and viewer roles.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400 sm:col-span-2" type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400 sm:col-span-2" type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400 sm:col-span-2" type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}>
            <option value="viewer">Viewer</option>
            <option value="analyst">Analyst</option>
            <option value="admin">Admin</option>
          </select>
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/5">Cancel</button>
          <button type="submit" className="flex-1 rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-400">Create</button>
        </div>
      </form>
    </div>
  );
}
