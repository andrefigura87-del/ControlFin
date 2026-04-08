import React, { useState } from 'react';
import { 
  List, Search, Edit2, Trash2, CreditCard, Building, Activity, FileText 
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { useFinance } from './useFinance';
import ListHeader from '../../shared/components/ListHeader';
import Modal from '../../shared/components/Modal';

const TransactionsView = () => {
  const { data, metrics, utils, operations } = useFinance();
  const { formatMoney, formatDate } = utils;
  const { saveItem, deleteItem } = operations;
  const { todayISO } = metrics;

  // ESTADOS LOCAIS PARA FILTROS E MODAIS
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteContext, setDeleteContext] = useState(null);

  const getFilteredTransactions = () => {
    return data.transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = !filterCategory || t.categoryId === filterCategory;
      const matchesDate = (!filterDateStart || t.date >= filterDateStart) && (!filterDateEnd || t.date <= filterDateEnd);
      return matchesSearch && matchesCat && matchesDate;
    }).sort((a,b)=>new Date(b.date) - new Date(a.date));
  };

  const txs = getFilteredTransactions();

  const handleExportCSV = () => {
    const headers = ['Data', 'Descricao', 'Categoria', 'Fonte', 'Valor', 'Status'];
    const rows = txs.map(t => {
      const cat = data.categories.find(c => c.id === t.categoryId);
      const source = t.paymentMethod?.type === 'account' ? data.accounts.find(a=>a.id===t.paymentMethod.id) : data.cards.find(c=>c.id===t.paymentMethod.id);
      const amount = t.type === 'Despesa' ? -t.amount : t.amount;
      return [
        t.date, 
        t.description.replace(/,/g, ''), 
        cat?.name || '', 
        source?.name || '', 
        amount.toFixed(2), 
        t.isPaid ? 'Efetivado' : 'Provisionado'
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `extrato_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const FormTransaction = ({ item }) => {
    const defaultWallet = data.accounts[0]?.id || '';
    const [form, setForm] = useState(item || {
      description: '', amount: '', type: 'Despesa', date: todayISO,
      categoryId: data.categories.find(c => c.type === 'Despesa')?.id || data.categories[0]?.id || '',
      paymentMethod: { type: 'account', id: defaultWallet },
      familyId: data.family[0]?.id || '', isPaid: true, isRecurring: false, notes: '',
      destinationAccountId: ''
    });

    // Lógica para Tipo Reserva: Forçar categoria e limpar destino se não for reserva
    React.useEffect(() => {
      if (form.type === 'Reserva') {
        const reservaCat = data.categories.find(c => c.type === 'Reserva' || c.name.includes('Reserva'));
        if (reservaCat && form.categoryId !== reservaCat.id) {
          setForm(prev => ({ ...prev, categoryId: reservaCat.id }));
        }
      }
    }, [form.type, data.categories]);

    const handleLocalSave = async () => {
      await saveItem(form, 'transactions');
      setModalType(null);
      setEditingItem(null);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-zinc-950 rounded-lg">
          {['Despesa', 'Receita', 'Reserva'].map(t => (
            <button key={t} onClick={()=>setForm({...form, type: t})} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${form.type === t ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'}`}>{t}</button>
          ))}
        </div>
        <div><label className="block text-xs text-zinc-400 mb-1">Descrição</label><input autoFocus value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Valor</label><NumericFormat value={form.amount} onValueChange={(v)=>setForm({...form, amount: v.floatValue})} prefix="R$ " thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Data</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 [color-scheme:dark]" /></div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {form.type === 'Reserva' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Origem (Saída)</label>
                <select 
                  value={form.paymentMethod?.id} 
                  onChange={e => setForm({...form, paymentMethod: { type: 'account', id: e.target.value }})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione a Origem</option>
                  {data.accounts.map(a => <option key={a.id} value={a.id}>🏦 {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Destino (Entrada)</label>
                <select 
                  value={form.destinationAccountId} 
                  onChange={e => setForm({...form, destinationAccountId: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o Destino</option>
                  {data.accounts.map(a => <option key={a.id} value={a.id}>🏦 {a.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Categoria</label>
                <select 
                  value={form.categoryId} 
                  onChange={e=>setForm({...form, categoryId: e.target.value})} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  {data.categories.filter(c => c.type === form.type || form.type === 'Transferência').map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fonte de Pagamento</label>
                <select 
                  value={form.paymentMethod?.id} 
                  onChange={e => {
                    const account = data.accounts.find(a => a.id === e.target.value);
                    setForm({...form, paymentMethod: { type: account ? 'account' : 'card', id: e.target.value }});
                  }} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <optgroup label="Contas">
                    {data.accounts.map(a => <option key={a.id} value={a.id}>🏦 {a.name}</option>)}
                  </optgroup>
                  <optgroup label="Cartões">
                    {data.cards.map(c => <option key={c.id} value={c.id}>💳 {c.name}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Familiar</label>
            <select 
              value={form.familyId} 
              onChange={e=>setForm({...form, familyId: e.target.value})} 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
            >
              <option value="">Selecione o Membro</option>
              {data.family.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 mt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPaid} onChange={e=>setForm({...form, isPaid: e.target.checked})} className="accent-emerald-500 w-4 h-4" />
              <span className="text-sm text-zinc-300">Efetivado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRecurring} onChange={e=>setForm({...form, isRecurring: e.target.checked})} className="accent-emerald-500 w-4 h-4" />
              <span className="text-sm text-zinc-300">Mensal</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Observações</label>
          <textarea 
            value={form.notes} 
            onChange={e=>setForm({...form, notes: e.target.value})} 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 min-h-[80px]"
            placeholder="Detalhes adicionais..."
          />
        </div>

        <button onClick={handleLocalSave} disabled={!form.amount} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition shadow-lg shadow-emerald-500/20">
          Salvar Transação
        </button>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex-1 w-full md:w-auto">
          <ListHeader title="Transações" icon={List} onAdd={() => { setEditingItem(null); setModalType('transaction'); }} />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button onClick={handleExportCSV} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl flex items-center gap-2 border border-zinc-700 transition text-sm">
            <FileText size={18}/> Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden flex flex-col mb-8">
        <div className="p-4 border-b border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-950/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-zinc-500"/>
            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Burcar descrição..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
          </div>
          
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500">
            <option value="">Todas Categorias</option>
            {data.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <div className="flex gap-2">
            <input type="date" value={filterDateStart} onChange={e=>setFilterDateStart(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
            <input type="date" value={filterDateEnd} onChange={e=>setFilterDateEnd(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
          </div>

          <button onClick={()=>{setSearchTerm(''); setFilterCategory(''); setFilterDateStart(''); setFilterDateEnd('');}} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition">Limpar Filtros</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Fonte</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {txs.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-500 italic">Nenhuma transação encontrada para este filtro.</td></tr>
              ) : txs.map(t => {
                const cat = data.categories.find(c => c.id === t.categoryId);
                const source = t.paymentMethod?.type === 'account' ? data.accounts.find(a=>a.id===t.paymentMethod.id) : data.cards.find(c=>c.id===t.paymentMethod.id);
                return (
                  <tr key={t.id} className="hover:bg-zinc-800/30 transition group">
                    <td className="px-4 py-3 text-zinc-300">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white group-hover:text-emerald-400 transition flex items-center gap-2">
                        {t.description}
                        {!t.isPaid && <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 uppercase tracking-wider">Provisionado</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {cat && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300"><span>{cat.icon}</span> {cat.name}</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs flex items-center gap-2">
                      {t.paymentMethod?.type === 'card' ? <CreditCard size={14}/> : <Building size={14}/>} {source?.name}
                    </td>
                    <td className={`px-4 py-3 font-mono text-right font-medium ${t.type === 'Receita' ? 'text-emerald-400' : t.type === 'Reserva' ? 'text-blue-400' : 'text-rose-400'}`}>
                      {t.type === 'Despesa' ? '-' : '+'}{formatMoney(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center opacity-0 group-hover:opacity-100 transition">
                      <button onClick={()=>{setEditingItem(t); setModalType('transaction');}} className="p-1 text-zinc-500 hover:text-emerald-400 mx-1 transition"><Edit2 size={16}/></button>
                      <button onClick={()=>{setDeleteContext({id: t.id, collection: 'transactions', title: t.description}); setModalType('delete');}} className="p-1 text-zinc-500 hover:text-rose-400 mx-1 transition"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalType === 'transaction' && (
        <Modal title={editingItem ? 'Editar Transação' : 'Nova Transação'} onClose={() => setModalType(null)}>
          <FormTransaction item={editingItem} />
        </Modal>
      )}

      {modalType === 'delete' && (
        <Modal title="Confirmar Exclusão" onClose={() => setModalType(null)}>
          <div className="p-4 text-center">
            <Activity size={48} className="text-rose-500 mx-auto mb-4" />
            <p className="text-zinc-300 mb-6">Tem certeza que deseja excluir <strong>{deleteContext?.title}</strong>?</p>
            <div className="flex gap-4">
              <button onClick={() => setModalType(null)} className="flex-1 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition">Cancelar</button>
              <button onClick={async () => { await deleteItem(deleteContext.id, 'transactions'); setModalType(null); }} className="flex-1 py-2 bg-rose-600 rounded-lg hover:bg-rose-700 transition">Excluir</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionsView;
