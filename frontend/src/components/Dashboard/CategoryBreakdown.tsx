import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryBreakdownProps {
  data: Array<{ _id: string; totalAmount: number; count: number }>;
}

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#a78bfa', '#fb7185', '#22d3ee'];

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const chartData = data.slice(0, 7).map((item) => ({
    name: item._id,
    value: item.totalAmount,
  }));

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
          <p className="text-sm text-slate-400">Top categories by transaction value</p>
        </div>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
