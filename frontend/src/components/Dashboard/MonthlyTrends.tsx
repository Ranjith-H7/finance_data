import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MonthlyTrendsProps {
  data: Array<{ year: number; month: number; income: number; expense: number; net: number }>;
}

export function MonthlyTrends({ data }: MonthlyTrendsProps) {
  const chartData = [...data]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((item) => ({
      month: new Date(item.year, item.month - 1, 1).toLocaleString('default', { month: 'short' }),
      income: item.income,
      expense: item.expense,
      net: item.net,
    }));

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Monthly Trends</h3>
        <p className="text-sm text-slate-400">Income and expense movement over time</p>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="month" tick={{ fill: '#cbd5e1' }} />
            <YAxis tick={{ fill: '#cbd5e1' }} />
            <Tooltip />
            <Bar dataKey="income" fill="#34d399" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" fill="#fb7185" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
