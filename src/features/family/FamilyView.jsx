import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useFinance } from '../transactions/useFinance';
import ListHeader from '../../shared/components/ListHeader';

const FamilyView = ({ onEdit, onAdd }) => {
  const { data, metrics, utils } = useFinance();
  const { formatMoney } = utils;
  const { todayISO } = metrics;

  const familyStats = useMemo(() => {
    return data.family.map(member => {
      const spending = data.transactions
        .filter(t => 
          t.familyId === member.id && 
          t.type === 'Despesa' && 
          (t.isPaid !== false || t.date <= todayISO)
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      return { ...member, spending };
    });
  }, [data.family, data.transactions, todayISO]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ListHeader 
        title="Família" 
        icon={Users} 
        onAdd={onAdd} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {familyStats.map(f => (
          <div key={f.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors"></div>
            
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
              {f.name[0]}
            </div>
            
            <div className="space-y-1 relative z-10">
              <h3 className="font-bold text-white text-lg">{f.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{f.relation}</p>
              
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-400 mb-1">Gastos no Mês:</p>
                <p className="text-lg font-mono font-medium text-emerald-400">
                  {formatMoney(f.spending)}
                </p>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onEdit(f)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                 <Users size={14}/>
               </button>
            </div>
          </div>
        ))}

        {familyStats.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500">Nenhum familiar cadastrado. Comece adicionando um novo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyView;
