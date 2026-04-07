import React from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, Activity, CreditCard as CardIcon 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '../transactions/useFinance';
import AccountCard from '../../shared/components/AccountCard';
import CreditCard from '../../shared/components/CreditCard';

const DashboardView = ({ onEditAccount, onDeleteAccount }) => {
  const { data, metrics, utils } = useFinance();
  const { formatMoney } = utils;
  const { 
    totalBalance, monthReceitas, monthDespesas, monthReservas, 
    expensesByCategory, maxExpense, chartData, todayISO 
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Resumo Superior */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Saldo Total', val: totalBalance, icon: Wallet, color: 'text-white' },
          { label: 'Receitas do Mês', val: monthReceitas, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Reservas do Mês', val: monthReservas, icon: DollarSign, color: 'text-blue-400' },
          { label: 'Despesas do Mês', val: monthDespesas, icon: TrendingDown, color: 'text-rose-400' },
        ].map((card, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <div className="text-zinc-400 text-sm mb-1 flex items-center gap-2">
              <card.icon size={16}/> {card.label}
            </div>
            <div className={`text-2xl md:text-3xl font-mono tracking-tight ${card.color}`}>
              {formatMoney(card.val)}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de Liquidez */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-medium text-emerald-400 mb-6 flex justify-between items-center font-sans">
          <div className="flex items-center gap-2"><Activity size={18}/> Evolução de Liquidez Diária</div>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                itemStyle={{ fontSize: '12px' }} 
              />
              <Area type="monotone" dataKey="Saldo Projetado" stroke="#71717a" strokeDasharray="5 5" fillOpacity={0} />
              <Area type="monotone" dataKey="Saldo Real" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas & Cartões */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-medium text-emerald-400 mb-4 flex items-center gap-2 font-sans">
            <CardIcon size={18}/> Contas & Cartões
          </h3>
          <div className="space-y-3">
            {data.accounts.map(a => (
              <AccountCard 
                key={a.id} 
                account={a} 
                balance={a.balance + data.transactions.filter(t=>t.paymentMethod?.id === a.id && t.isPaid !== false).reduce((acc,t)=>acc+(t.type==='Despesa' || t.type==='Reserva'?-t.amount:t.amount),0)} 
                formatMoney={formatMoney}
                onEdit={onEditAccount}
                onDelete={onDeleteAccount}
              />
            ))}
            {data.cards.map(c => (
              <CreditCard 
                key={c.id} 
                card={c} 
                variant="compact"
                used={data.transactions.filter(t => t.paymentMethod?.id === c.id && t.date <= todayISO).reduce((acc,t)=>acc+t.amount,0)}
                formatMoney={formatMoney}
              />
            ))}
          </div>
        </div>

        {/* Categotias */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col font-sans">
          <h3 className="text-lg font-medium text-emerald-400 mb-4 flex items-center gap-2">
            <Activity size={18}/> Despesas por Categoria
          </h3>
          <div className="flex-1 space-y-4">
            {expensesByCategory.map(c => (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-300"><span>{c.icon}</span> {c.name}</div>
                  <div className="font-mono text-zinc-400">{formatMoney(c.total)}</div>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(c.total / maxExpense) * 100}%`, backgroundColor: c.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
