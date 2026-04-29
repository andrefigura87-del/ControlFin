import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  slate: '#64748b',
  zinc: '#71717a',
  orange: '#f97316',
  purple: '#a855f7'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl p-3 animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{payload[0].name}</p>
        <p className="text-sm font-mono font-bold text-white">
          R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const CategoryExpenseChart = ({ transactions, categories }) => {
  const chartData = useMemo(() => {
    // Filtrar apenas despesas e pagamentos de fatura para o gráfico de gastos
    const expenses = (transactions || []).filter(t => t.type === 'Despesa' || t.type === 'Pagamento Fatura');
    
    const categoryTotals = {};
    
    expenses.forEach(t => {
      const category = categories.find(c => String(c.id) === String(t.categoryId)) || { name: 'Outros', color: 'zinc' };
      categoryTotals[category.name] = (categoryTotals[category.name] || 0) + (parseFloat(t.amount) || 0);
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS[categories.find(c => c.name === name)?.color] || COLORS.zinc
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  if (chartData.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-zinc-500 gap-2 py-10">
        <div className="w-16 h-16 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800">
          📊
        </div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-600">Nenhum gasto este mês</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[220px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'transparent' }} 
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Centro do Donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Gastos</span>
        <span className="text-xs font-mono font-bold text-zinc-300">Categorias</span>
      </div>
    </div>
  );
};

export default CategoryExpenseChart;
