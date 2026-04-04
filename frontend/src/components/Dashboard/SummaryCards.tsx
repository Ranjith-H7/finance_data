import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface SummaryCardsProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    totalRecords: number;
    totalUsers: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
  };
}

const money = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { title: 'Total Income', value: summary.totalIncome, icon: ArrowTrendingUpIcon, tone: 'from-emerald-500/20 to-emerald-400/5 text-emerald-300' },
    { title: 'Total Expense', value: summary.totalExpense, icon: ArrowTrendingDownIcon, tone: 'from-rose-500/20 to-rose-400/5 text-rose-300' },
    { title: 'Net Balance', value: summary.netBalance, icon: BanknotesIcon, tone: 'from-sky-500/20 to-sky-400/5 text-sky-300' },
    { title: 'Records', value: summary.totalRecords, icon: BanknotesIcon, tone: 'from-violet-500/20 to-violet-400/5 text-violet-300' },
    { title: 'Users', value: summary.totalUsers, icon: BanknotesIcon, tone: 'from-amber-500/20 to-amber-400/5 text-amber-300' },
    { title: 'Average', value: summary.averageAmount, icon: BanknotesIcon, tone: 'from-cyan-500/20 to-cyan-400/5 text-cyan-300' },
    { title: 'Minimum', value: summary.minAmount, icon: BanknotesIcon, tone: 'from-fuchsia-500/20 to-fuchsia-400/5 text-fuchsia-300' },
    { title: 'Maximum', value: summary.maxAmount, icon: BanknotesIcon, tone: 'from-lime-500/20 to-lime-400/5 text-lime-300' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.title} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${card.tone} p-5 shadow-glow backdrop-blur-sm`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">{card.title}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                {card.title === 'Records' ? card.value : `₹${money(card.value)}`}
              </p>
            </div>
            <card.icon className="h-10 w-10 text-white/90" />
          </div>
        </article>
      ))}
    </div>
  );
}
