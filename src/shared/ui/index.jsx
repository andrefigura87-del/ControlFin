import React from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard as CardIcon, Edit2, Trash2 } from 'lucide-react';

const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-2xl shadow-lg p-5 ${className}`}>
    {children}
  </div>
);

export const Button = ({ children, variant = 'solid', onClick, className = '' }) => {
  const base = "px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
  const variants = {
    solid: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
    outline: "border border-gray-700 hover:border-gray-600 text-gray-300 hover:bg-gray-800/50"
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const InputBase = ({ className = '', ...props }) => (
  <input 
    className={`w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm ${className}`} 
    {...props} 
  />
);

export const Select = ({ children, className = '', ...props }) => (
  <select 
    className={`w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm cursor-pointer appearance-none ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const SummaryCard = ({ title, value, trend = 'neutral', icon = 'wallet', className = '' }) => {
  const trends = {
    positive: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp },
    negative: { color: 'text-rose-400', bg: 'bg-rose-500/10', icon: TrendingDown },
    neutral: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Wallet }
  };
  const t = trends[trend] || trends.neutral;
  const IconComponent = t.icon;

  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-400 font-medium text-sm tracking-wide">{title}</span>
        <div className={`p-2 rounded-lg ${t.bg} ${t.color}`}>
          <IconComponent size={18} />
        </div>
      </div>
      <div className={`text-3xl font-semibold tracking-tight ${t.color}`}>
        {value}
      </div>
    </Card>
  );
};

export const CreditCardWidget = ({ bankName, limit, used, lastFour, className = '' }) => {
  const available = limit - used;
  const percentage = (used / limit) * 100;
  
  return (
    <Card className={`flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-gray-300 font-medium">
          <CardIcon size={20} className="text-purple-400" />
          {bankName}
        </div>
        <span className="text-xs font-mono text-gray-500 border border-gray-800 px-2 py-1 rounded-md">
          •••• {lastFour}
        </span>
      </div>
      
      <div className="mt-auto space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Fatura Atual</span>
            <span className="text-gray-200 font-mono">{formatMoney(used)}</span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Limite Disponível</span>
          <span className="font-mono text-emerald-400">{formatMoney(available)}</span>
        </div>
      </div>
    </Card>
  );
};


export const TransactionTable = ({ transactions = [], emptyMessage = "Nenhuma transação encontrada.", onEdit, onDelete, className = '' }) => {
  if (!transactions.length) return <Card className="text-center text-gray-500 py-8">{emptyMessage}</Card>;
  
  const hasActions = !!onEdit || !!onDelete;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
            <th className="pb-3 pl-4 font-semibold">Data</th>
            <th className="pb-3 font-semibold">Descrição</th>
            <th className="pb-3 font-semibold">Categoria</th>
            <th className="pb-3 pr-4 font-semibold text-right">Valor</th>
            {hasActions && <th className="pb-3 pr-4 font-semibold text-center">Ações</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-800/20 transition-colors group">
              <td className="py-4 pl-4 text-sm text-gray-400 whitespace-nowrap">
                {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </td>
              <td className="py-4 text-sm font-medium text-gray-200">{tx.description}</td>
              <td className="py-4 text-sm text-gray-500">
                {typeof tx.category === 'string' ? (
                  <span className="bg-gray-800/50 px-2.5 py-1 rounded-md border border-gray-700/50">{tx.category}</span>
                ) : (
                  tx.category
                )}
              </td>
              <td className="py-4 pr-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {tx.type === 'income' ? (
                    <ArrowUpRight size={16} className="text-emerald-500" />
                  ) : (
                    <ArrowDownRight size={16} className="text-rose-500" />
                  )}
                  <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              </td>
              {hasActions && (
                <td className="py-4 pr-4 text-center opacity-0 group-hover:opacity-100 transition">
                  <div className="flex items-center justify-center gap-2">
                    {onEdit && (
                      <button onClick={() => onEdit(tx.raw || tx)} className="p-1.5 text-gray-500 hover:text-emerald-400 transition-colors">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(tx.raw || tx)} className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
