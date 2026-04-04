import type { FinanceRecord as FinanceRecordType } from '../../types';

interface FinanceRecordProps {
  record: FinanceRecordType;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (record: FinanceRecordType) => void;
  onDelete: (id: string) => void;
  showOwner?: boolean;
  ownerLabel?: string;
}

export function FinanceRecord({ record, canEdit, canDelete, onEdit, onDelete, showOwner = false, ownerLabel = '-' }: FinanceRecordProps) {
  return (
    <tr className="border-b border-white/10 text-slate-200">
      <td className="px-4 py-4">{new Date(record.date).toLocaleDateString()}</td>
      {showOwner && <td className="px-4 py-4 text-sm text-slate-300">{ownerLabel}</td>}
      <td className="px-4 py-4">
        <p className="font-medium text-white">{record.description ?? record.note ?? record.category}</p>
        <p className="text-xs text-slate-400">{record.merchant ?? 'No merchant'}</p>
      </td>
      <td className="px-4 py-4">{record.category}</td>
      <td className="px-4 py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.type === 'income' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
          {record.type}
        </span>
      </td>
      <td className="px-4 py-4 font-semibold text-white">₹{record.amount.toLocaleString('en-IN')}</td>
      <td className="px-4 py-4">
        <div className="flex gap-3">
          {canEdit && (
            <button onClick={() => onEdit(record)} className="text-sm font-semibold text-sky-300 transition hover:text-sky-200">Edit</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(record._id)} className="text-sm font-semibold text-rose-300 transition hover:text-rose-200">Delete</button>
          )}
        </div>
      </td>
    </tr>
  );
}
