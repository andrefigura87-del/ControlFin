import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';

const InputBase = ({ className = '', ...props }) => (
  <input 
    className={`w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm ${className}`} 
    {...props} 
  />
);

/**
 * SplitWidget - Componente de Rateio Familiar do ControlFin
 * @param {number} totalAmount - Valor total da transação
 * @param {Array} members - Lista de membros da família disponíveis
 * @param {Array} splits - Lista de rateios atuais [{memberId, amount}]
 * @param {Function} onChange - Callback disparado ao alterar os rateios
 */
export default function SplitWidget({ totalAmount, members, splits, onChange, subtitle = "DISTRIBUIÇÃO DE CUSTOS" }) {
  // Inicializa o estado local com os splits existentes ou cria um array vazio
  const [localSplits, setLocalSplits] = useState(splits || []);

  // Sincroniza estado local se a prop mudar externamente
  useEffect(() => {
    if (splits) setLocalSplits(splits);
  }, [splits]);

  const currentTotal = localSplits.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
  const diff = Math.abs(totalAmount - currentTotal);
  
  // Tolerância para erros de ponto flutuante
  const isBalanced = diff < 0.01;

  const handleSplitChange = (memberId, value) => {
    const numericValue = parseFloat(value) || 0;
    
    // Atualiza o membro específico e garante que os outros existam no array (mesmo com 0)
    const updated = members.map(m => {
      if (m.id === memberId) return { memberId: m.id, amount: numericValue };
      
      const existing = localSplits.find(s => s.memberId === m.id);
      return existing || { memberId: m.id, amount: 0 };
    });

    setLocalSplits(updated);
    onChange(updated);
  };

  // Atalho para 100% para um membro
  const handleSetFull = (memberId) => {
    const updated = members.map(m => ({
      memberId: m.id,
      amount: m.id === memberId ? totalAmount : 0
    }));
    setLocalSplits(updated);
    onChange(updated);
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 space-y-5 shadow-2xl">
      {/* Header com Validação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Users size={16} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Rateio Familiar</h4>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{subtitle}</p>
          </div>
        </div>
        
        <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border transition-all duration-300 ${
          isBalanced 
            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
        }`}>
          {isBalanced ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span className="text-[11px] font-mono font-bold uppercase tracking-tight">
            {isBalanced ? 'Equilibrado' : `Restam R$ ${diff.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Lista de Membros */}
      <div className="grid grid-cols-1 gap-2.5">
        {members.map(member => {
          const split = localSplits.find(s => s.memberId === member.id);
          const amount = split ? split.amount : 0;
          const percentage = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(0) : 0;

          return (
            <div 
              key={member.id} 
              className="group flex items-center gap-4 bg-zinc-950/40 hover:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-default"
            >
              {/* Avatar/Emoji */}
              <button 
                onClick={() => handleSetFull(member.id)}
                title="Atribuir 100% a este membro"
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-inner transition-transform active:scale-95 ${
                  amount > 0 ? `bg-${member.color || 'zinc'}-500/20 text-white` : 'bg-zinc-900 text-zinc-600 grayscale'
                }`}
              >
                {member.icon || '👤'}
              </button>

              {/* Nome e Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200 truncate">{member.name}</span>
                  {amount > 0 && (
                    <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      {percentage}%
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">
                  {member.relation || 'Membro'}
                </span>
              </div>

              {/* Input de Valor */}
              <div className="w-28 relative">
                <InputBase 
                  type="number"
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => handleSplitChange(member.id, e.target.value)}
                  className={`text-right font-mono !py-1.5 text-xs !bg-zinc-950/80 border-transparent focus:border-emerald-500/50 ${amount > 0 ? 'text-white' : 'text-zinc-600'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Info */}
      <div className="pt-2 flex justify-between items-center text-[10px] text-zinc-500 px-1">
        <span className="flex items-center gap-1">
          <AlertCircle size={10} /> Clique no ícone para 100%
        </span>
        <span className="font-mono">Total: R$ {totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
