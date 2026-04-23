import React, { useState } from 'react';
import { 
  List, Search, Edit2, Trash2, CreditCard, Building, Activity, FileText, Upload, HelpCircle
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { useFinance } from './useFinance';
import ListHeader from '../../shared/components/ListHeader';
import Modal from '../../shared/components/Modal';
import { exportTransactionsToCSV, downloadCSV } from '../../lib/exportUtils';
import ImportModal from './ImportModal';
import { supabase } from '../../lib/supabase';
import EmojiIcon from '../../shared/components/EmojiIcon';

// Componente principal
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
  const [filterSource, setFilterSource] = useState('');
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteContext, setDeleteContext] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [existingExternalIds, setExistingExternalIds] = useState([]);

  const getFilteredTransactions = () => {
    return data.transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = !filterCategory || t.categoryId === filterCategory;
      const matchesSource = !filterSource || t.paymentMethod?.id === filterSource;
      const matchesDate = (!filterDateStart || t.date >= filterDateStart) && (!filterDateEnd || t.date <= filterDateEnd);
      return matchesSearch && matchesCat && matchesSource && matchesDate;
    }).sort((a,b)=>new Date(b.date) - new Date(a.date));
  };

  const txs = getFilteredTransactions();


  // Funções para Importação OFX
  const fetchExistingExternalIds = async () => {
    const { data: txs } = await supabase
      .from("transactions")
      .select("external_id")
      .not("external_id", "is", null);
    return txs?.map(t => t.external_id).filter(Boolean) || [];
  };

  const handleOpenImport = async () => {
    const ids = await fetchExistingExternalIds();
    setExistingExternalIds(ids);
    setImportModalOpen(true);
  };

const handleImportTransactions = async (transactionsToImport, options = {}) => {
    const { replaceExisting = false } = options;
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) throw new Error("Usuário não autenticado");

    // Obter wallet_id das transações para o replace
    const walletId = transactionsToImport[0]?.wallet_id;
    const hasWalletId = walletId && transactionsToImport.every(tx => tx.wallet_id === walletId);

    // WIPE & REPLACE: Se ativado, primeiro excluir todas as transações da carteira
    if (replaceExisting && hasWalletId) {
      try {
        const { error: deleteError } = await supabase
          .from("transactions")
          .delete()
          .eq('wallet_id', walletId)
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Erro ao excluir transações:', deleteError);
          throw new Error('Falha ao limpar transações anteriores. Importação cancelada.');
        }
      } catch (deleteErr) {
        console.error('Delete falhou:', deleteErr);
        throw new Error('Não foi possível limpar as transações anteriores. Tente novamente.');
      }
    }

    // Filtrar duplicados (só se não for replace)
    let validTxs = transactionsToImport;
    if (!replaceExisting) {
      validTxs = transactionsToImport.filter(tx =>
        !existingExternalIds.includes(tx.external_id)
      );
    }

    if (validTxs.length === 0 && !replaceExisting) {
      throw new Error("Todas as transações já foram importadas");
    }

    // Preparar dados para inserção
    const records = validTxs.map(tx => ({
      user_id: userId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      date: tx.date,
      category_id: tx.category_id,
      wallet_id: tx.wallet_id,
      external_id: (tx.external_id && tx.external_id !== 'null') ? tx.external_id : null,
      notes: tx.notes || null,
      is_paid: true
    }));


    // UPSERT no banco (previne duplicatas via constraint UNIQUE)
    const { error } = await supabase
      .from("transactions")
      .upsert(records, { onConflict: 'external_id', ignoreDuplicates: true })
      .select();

    if (error) throw error;


    // Recarregar dados
    await operations.refresh();

    return {
      imported: validTxs.length,
      replaced: replaceExisting
    };
  };

  const handleExportCSV = () => {
    const csvContent = exportTransactionsToCSV(txs, data.categories, data.accounts, data.cards);
    const filename = `extrato_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const FormTransaction = ({ item }) => {
    const defaultWallet = data.accounts[0]?.id || '';
    const [form, setForm] = useState(item || {
      description: '', amount: '', type: 'Despesa', date: todayISO,
      categoryId: data.categories.find(c => c.type === 'Despesa')?.id || data.categories[0]?.id || '',
      paymentMethod: { type: 'account', id: defaultWallet },
      familyId: data.family[0]?.id || '', isPaid: true, isRecurring: false, notes: '',
      destinationAccountId: '', isInstallment: false, installmentsCount: 2
    });

    // Lógica para Tipo Reserva: Forçar categoria e limpar destino se não for reserva
    React.useEffect(() => {
      if (form.type === 'Reserva') {
        const reservaCat = data.categories.find(c => c.type === 'Reserva' || c.name.includes('Reserva'));
        if (reservaCat && form.categoryId !== reservaCat.id) {
          setForm(prev => ({ ...prev, categoryId: reservaCat.id }));
        }
      }
    }, [form.type, form.categoryId]);

    const handleLocalSave = async () => {
      let finalForm = { ...form };
      if (form.type === 'Transferência') {
        finalForm.categoryId = null; // Transferências puras não tem categoria
      } else if (form.type === 'Pagamento Fatura') {
        const ccCategory = data.categories.find(c => c.name.toLowerCase().includes('cartão') || c.name.toLowerCase().includes('cartao'));
        if (ccCategory) finalForm.categoryId = ccCategory.id;
      }
      await saveItem(finalForm, 'transactions');
      setModalType(null);
      setEditingItem(null);
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-950/50 rounded-xl border border-zinc-900">
          {[
            { id: 'Despesa', label: 'Despesa', color: 'bg-rose-500/15 text-rose-400 border border-rose-500/20' },
            { id: 'Receita', label: 'Receita', color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
            { id: 'Transferência', label: 'Transferência', color: 'bg-zinc-800 text-zinc-300 border border-zinc-700' },
            { id: 'Pagamento Fatura', label: 'Pagar Fatura', color: 'bg-purple-500/15 text-purple-400 border border-purple-500/20' },
            { id: 'Reserva', label: 'Reserva', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={()=>setForm({...form, type: t.id})} 
              className={`flex-1 min-w-[80px] sm:min-w-[100px] px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                form.type === t.id 
                  ? t.color + ' shadow-lg' 
                  : 'bg-transparent text-zinc-500 border border-transparent hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div><label className="block text-xs text-zinc-400 mb-1">Descrição</label><input autoFocus value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Valor</label><NumericFormat value={form.amount} onValueChange={(v)=>setForm({...form, amount: v.floatValue})} prefix="R$ " thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Data</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 [color-scheme:dark]" /></div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {(form.type === 'Reserva' || form.type === 'Transferência' || form.type === 'Pagamento Fatura') ? (
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
                <label className="block text-xs text-zinc-400 mb-1">Destino ({form.type === 'Pagamento Fatura' ? 'Cartão' : 'Conta'})</label>
                <select 
                  value={form.destinationAccountId} 
                  onChange={e => setForm({...form, destinationAccountId: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o Destino</option>
                  {form.type === 'Pagamento Fatura' ? (
                    data.cards.map(c => <option key={c.id} value={c.id}>💳 {c.name}</option>)
                  ) : (
                    data.accounts.map(a => <option key={a.id} value={a.id} disabled={a.id === form.paymentMethod?.id}>🏦 {a.name}</option>)
                  )}
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPaid} onChange={e=>setForm({...form, isPaid: e.target.checked})} className="accent-emerald-500 w-4 h-4" />
              <span className="text-sm text-zinc-300">Efetivado</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRecurring} onChange={e=>setForm({...form, isRecurring: e.target.checked, isInstallment: false})} className="accent-emerald-500 w-4 h-4" />
              <span className="text-sm text-zinc-300">Mensal</span>
            </label>

            {form.paymentMethod?.type === 'card' && form.type === 'Despesa' && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isInstallment} onChange={e=>setForm({...form, isInstallment: e.target.checked, isRecurring: false})} className="accent-emerald-500 w-4 h-4" />
                  <span className="text-sm text-zinc-300">Parcelado</span>
                </label>
                {form.isInstallment && (
                  <input type="number" min="2" max="36" value={form.installmentsCount} onChange={e=>setForm({...form, installmentsCount: parseInt(e.target.value) || 2})} className="w-14 h-7 bg-zinc-950 border border-zinc-700 rounded px-1 text-xs font-mono text-center outline-none focus:border-emerald-500 transition-colors" />
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Observações</label>
          <textarea 
            value={form.notes || ''} 
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
      <ListHeader 
        title="Transações" 
        icon={List} 
        onAdd={() => { setEditingItem(null); setModalType('transaction'); }}
      >
        <button onClick={handleOpenImport} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl flex items-center gap-2 border border-zinc-700 transition text-sm">
          <Upload size={18}/> Importar OFX
        </button>
        <button onClick={handleExportCSV} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl flex items-center gap-2 border border-zinc-700 transition text-sm">
          <FileText size={18}/> Exportar CSV
        </button>
      </ListHeader>

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

          <select value={filterSource} onChange={e=>setFilterSource(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500">
            <option value="">Todas as Fontes</option>
            <optgroup label="Contas">
              {data.accounts.map(a => <option key={a.id} value={a.id}>🏦 {a.name}</option>)}
            </optgroup>
            <optgroup label="Cartões">
              {data.cards.map(c => <option key={c.id} value={c.id}>💳 {c.name}</option>)}
            </optgroup>
          </select>

          <div className="flex gap-2">
            <input type="date" value={filterDateStart} onChange={e=>setFilterDateStart(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
            <input type="date" value={filterDateEnd} onChange={e=>setFilterDateEnd(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
          </div>

          <button onClick={()=>{setSearchTerm(''); setFilterCategory(''); setFilterDateStart(''); setFilterDateEnd(''); setFilterSource('');}} className="col-span-1 md:col-span-full xl:col-span-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition mb-2">Limpar Filtros</button>
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
                      {t.notes && <div className="text-xs text-zinc-500 mt-1 max-w-[200px] truncate" title={t.notes}>{t.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {cat && (
                        <div className="flex items-center gap-2">
                          <EmojiIcon emoji={cat.icon || '📌'} color={cat.color || 'zinc'} size="sm" />
                          <span className="text-zinc-300 text-xs">{cat.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs flex items-center gap-2">
                      {t.paymentMethod?.type === 'card' ? <CreditCard size={14}/> : <Building size={14}/>} {source?.name}
                    </td>
                    <td className={`px-4 py-3 font-mono text-right font-medium ${t.type === 'Receita' || (t.type === 'Transferência' && t.destinationAccountId === source?.id) ? 'text-emerald-400' : t.type === 'Reserva' ? 'text-blue-400' : 'text-rose-400'}`}>
                      {t.type === 'Despesa' || ((t.type === 'Transferência' || t.type === 'Pagamento Fatura') && t.paymentMethod?.id === source?.id) ? '-' : '+'}{formatMoney(t.amount)}
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


      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        categories={data.categories}
        wallets={data.accounts}
        existingExternalIds={existingExternalIds}
        onImport={handleImportTransactions}
      />

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
