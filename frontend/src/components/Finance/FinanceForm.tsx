import { useState } from 'react';
import type { FinanceRecord, User } from '../../types';

interface FinanceFormProps {
  initialData?: Partial<FinanceRecord>;
  onSubmit: (data: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    note: string;
    paymentMethod: 'UPI' | 'CASH' | 'CARD';
    merchant: string;
    userId?: string;
  }) => Promise<void>;
  onClose: () => void;
  showUserSelector?: boolean;
  users?: User[];
  selectedUserId?: string;
}

const categories = ['Salary', 'Business', 'Food & Dining', 'Transportation', 'Shopping', 'Healthcare', 'Entertainment', 'Bills & Utilities', 'Other'];
const paymentMethods: Array<'UPI' | 'CASH' | 'CARD'> = ['UPI', 'CASH', 'CARD'];

export function FinanceForm({ initialData, onSubmit, onClose, showUserSelector = false, users = [], selectedUserId = 'all' }: FinanceFormProps) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount ? String(initialData.amount) : '',
    type: (initialData?.type ?? 'expense') as 'income' | 'expense',
    category: initialData?.category ?? '',
    date: initialData?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    note: initialData?.note ?? initialData?.description ?? '',
    paymentMethod: (initialData?.paymentMethod ?? 'UPI') as 'UPI' | 'CASH' | 'CARD',
    merchant: initialData?.merchant ?? '',
    userId: typeof initialData?.userId === 'string'
      ? initialData.userId
      : selectedUserId !== 'all'
        ? selectedUserId
        : '',
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (showUserSelector && !formData.userId) {
      return;
    }

    await onSubmit({
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      note: formData.note,
      paymentMethod: formData.paymentMethod,
      merchant: formData.merchant,
      ...(showUserSelector && formData.userId ? { userId: formData.userId } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-glow sm:p-8">
        <h2 className="text-2xl font-bold text-white">{initialData ? 'Edit Record' : 'Add Record'}</h2>
        <p className="mt-2 text-sm text-slate-400">Capture an income or expense entry for the dashboard.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {showUserSelector && (
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400 sm:col-span-2"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
              ))}
            </select>
          )}
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-brand-400" type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400 sm:col-span-2" type="text" placeholder="Merchant" value={formData.merchant} onChange={(e) => setFormData({ ...formData, merchant: e.target.value })} required />
          <textarea className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400 sm:col-span-2" placeholder="Note" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400 sm:col-span-2" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'UPI' | 'CASH' | 'CARD' })}>
            {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/5">Cancel</button>
          <button type="submit" className="flex-1 rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-400">Save</button>
        </div>
      </form>
    </div>
  );
}
