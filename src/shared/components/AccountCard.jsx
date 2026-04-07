import React from 'react';
import { Building, Edit2, Trash2 } from 'lucide-react';
import { getBrandStyle } from '../constants/branding';

const AccountCard = ({ account, balance, onEdit, onDelete, formatMoney }) => {
  const brandClass = getBrandStyle(account.name);
  const isBranded = !brandClass.includes('bg-zinc-800');

  return (
    <div className={`${isBranded ? brandClass : 'bg-zinc-900 border border-zinc-800'} rounded-2xl p-5 group hover:opacity-90 transition relative overflow-hidden`}>
      {!isBranded && (
        <div 
          className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 pointer-events-none" 
          style={{ backgroundColor: account.color }}
        ></div>
      )}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex gap-3 items-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${isBranded ? 'bg-black/20 backdrop-blur-sm shadow-inner' : 'bg-zinc-950 border border-zinc-800 text-zinc-200'}`} style={!isBranded ? {borderLeftColor: account.color, borderLeftWidth: 4} : {}}>
            <Building size={20} className={isBranded ? 'text-inherit opacity-80' : 'text-zinc-500'}/>
          </div>
          <div>
            <div className={`font-medium text-lg ${isBranded ? 'text-inherit' : 'text-white'}`}>{account.name}</div>
            <div className={`text-xs ${isBranded ? 'text-inherit opacity-70' : 'text-zinc-500'}`}>{account.type}</div>
          </div>
        </div>
        <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition rounded-lg p-1 shadow ${isBranded ? 'bg-black/20 backdrop-blur-md' : 'bg-zinc-950 border border-zinc-800'}`}>
          <button onClick={() => onEdit(account)} className={`p-1.5 rounded hover:bg-black/20 ${isBranded ? 'text-inherit' : 'text-zinc-400 hover:text-emerald-400'}`}>
            <Edit2 size={14}/>
          </button>
          <button onClick={() => onDelete(account.id, account.name)} className={`p-1.5 rounded ${isBranded ? 'text-inherit hover:text-red-900' : 'text-zinc-400 hover:text-rose-400'}`}>
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
      <div>
        <div className={`text-xs mb-1 ${isBranded ? 'text-inherit opacity-70' : 'text-zinc-500'}`}>Saldo Atual</div>
        <div className={`text-2xl font-mono ${isBranded ? 'text-inherit' : 'text-zinc-200'}`}>{formatMoney(balance)}</div>
      </div>
    </div>
  );
};

export default AccountCard;
