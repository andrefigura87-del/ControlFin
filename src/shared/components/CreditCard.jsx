import React from 'react';
import { CreditCard as CardIcon, Edit2, Trash2 } from 'lucide-react';

const CreditCard = ({ card, invoice, availableLimit, formatMoney, onEdit, onDelete, variant = 'full' }) => {
  // Variant 'compact' para o Dashboard
  if (variant === 'compact') {
    return (
      <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50 border border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: card.color + '20', color: card.color}}>
            <CardIcon size={18}/>
          </div>
          <div>
            <div className="font-medium text-zinc-200">{card.name}</div>
            <div className="text-xs font-mono text-zinc-500">•••• {card.digits}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-rose-400 text-sm">{formatMoney(invoice)} <span className="text-zinc-600 font-sans text-[10px] uppercase">fatura</span></div>
          <div className="font-mono text-emerald-400 text-xs">{formatMoney(availableLimit)} <span className="text-zinc-600 font-sans text-[10px] uppercase">disponível</span></div>
        </div>
      </div>
    );
  }

  // Variant 'full' para o View de Cartões
  return (
    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 mix-blend-overlay rounded-full blur-2xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 pointer-events-none" style={{backgroundColor: card.color}}></div>
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="text-zinc-400 text-sm font-sans uppercase tracking-widest">{card.flag}</div>
          <div className="font-medium text-xl text-white mt-1">{card.name}</div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onEdit(card)} className="p-2 bg-zinc-950/50 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition">
            <Edit2 size={16}/>
          </button>
          <button onClick={() => onDelete(card.id, card.name)} className="p-2 bg-zinc-950/50 hover:bg-rose-500/20 rounded-lg text-zinc-400 hover:text-rose-400 transition">
            <Trash2 size={16}/>
          </button>
        </div>
      </div>
      <div className="font-mono text-2xl tracking-widest text-zinc-300 mb-6 drop-shadow-sm">•••• •••• •••• {card.digits || '0000'}</div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-zinc-950/30 rounded-xl border border-zinc-800/50">
          <div className="text-[10px] text-zinc-500 uppercase mb-1">Fatura Atual</div>
          <div className="text-lg font-mono text-rose-400">{formatMoney(invoice)}</div>
        </div>
        <div className="p-3 bg-zinc-950/30 rounded-xl border border-zinc-800/50">
          <div className="text-[10px] text-zinc-500 uppercase mb-1">Disponível</div>
          <div className="text-lg font-mono text-emerald-400">{formatMoney(availableLimit)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-zinc-500 border-t border-zinc-800 pt-4">
        <div>Fechamento / Vencimento</div>
        <div className="font-mono text-zinc-300">{card.closingDay} / {card.dueDay}</div>
      </div>
    </div>
  );
};

export default CreditCard;
