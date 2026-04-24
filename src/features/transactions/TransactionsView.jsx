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
import { getCategoryConfig } from '../../shared/constants/categoryMap';
import { Card, Button, InputBase, TransactionTable, Select } from '../../shared/ui';

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

    // 1. Filtrar duplicados contra o banco (só se não for replace)
    // Usamos uma lógica de "chave composta" para ser mais preciso que apenas o FITID (que alguns bancos repetem)
    let validTxs = transactionsToImport;
    if (!replaceExisting) {
      // Nota: Esta é uma verificação simples no client-side. O banco fará o check final via unique constraint.
      validTxs = transactionsToImport.filter(tx =>
        !tx.external_id || !existingExternalIds.includes(tx.external_id)
      );
    }

    // 2. Dedup Interno do Lote: 
    // Evita inserir a MESMA transação duas vezes se ela vier duplicada no próprio arquivo.
    // Usamos uma chave composta (Data + Valor + Descrição + ID) para garantir unicidade real.
    const uniqueBatch = [];
    const seenBatchKeys = new Set();
    
    validTxs.forEach(tx => {
      const compositeKey = `${tx.date}_${tx.amount}_${tx.description}_${tx.external_id || 'no-id'}`;
      
      if (!seenBatchKeys.has(compositeKey)) {
        seenBatchKeys.add(compositeKey);
        uniqueBatch.push(tx);
      }
    });

    if (uniqueBatch.length === 0 && !replaceExisting) {
      throw new Error("Todas as transações deste arquivo já parecem ter sido importadas anteriormente.");
    }

    // Preparar dados para inserção
    const records = uniqueBatch.map(tx => ({
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


    // UPSERT no banco usando Chave Composta Robustecida
    // Agora o conflito só ocorre se (user, carteira, data, valor, descrição e ID externo) forem idênticos.
    const { error } = await supabase
      .from("transactions")
      .upsert(records, { 
        onConflict: 'user_id,wallet_id,date,amount,description,external_id', 
        ignoreDuplicates: true 
      })
      .select();

    if (error) throw error;

    // Recarregar dados
    await operations.refresh();

    return {
      imported: uniqueBatch.length,
      replaced: replaceExisting,
      totalDetected: transactionsToImport.length
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
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Descrição</label>
          <InputBase autoFocus value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Valor</label>
            <NumericFormat value={form.amount} onValueChange={(v)=>setForm({...form, amount: v.floatValue})} prefix="R$ " thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Data</label>
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm [color-scheme:dark]" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {(form.type === 'Reserva' || form.type === 'Transferência' || form.type === 'Pagamento Fatura') ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Origem (Saída)</label>
                <select 
                  value={form.paymentMethod?.id} 
                  onChange={e => setForm({...form, paymentMethod: { type: 'account', id: e.target.value }})}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm cursor-pointer"
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
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm cursor-pointer"
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
                <Select 
                  value={form.categoryId} 
                  onChange={e=>setForm({...form, categoryId: e.target.value})} 
                >
                  <option value="" className="bg-zinc-900">Selecione uma categoria...</option>
                  {data.categories.filter(c => c.type === form.type || form.type === 'Transferência').map(c => {
                    const config = getCategoryConfig(c.icon);
                    return (
                      <option key={c.id} value={c.id} className="bg-zinc-900">
                        {config.emoji} {c.name}
                      </option>
                    );
                  })}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fonte de Pagamento</label>
                <Select 
                  value={form.paymentMethod?.id} 
                  onChange={e => {
                    const account = data.accounts.find(a => a.id === e.target.value);
                    setForm({...form, paymentMethod: { type: account ? 'account' : 'card', id: e.target.value }});
                  }} 
                >
                  <optgroup label="Contas" className="bg-zinc-900 text-zinc-500 text-xs">
                    {data.accounts.map(a => <option key={a.id} value={a.id} className="bg-zinc-900 text-white">🏦 {a.name}</option>)}
                  </optgroup>
                  <optgroup label="Cartões" className="bg-zinc-900 text-zinc-500 text-xs">
                    {data.cards.map(c => <option key={c.id} value={c.id} className="bg-zinc-900 text-white">💳 {c.name}</option>)}
                  </optgroup>
                </Select>
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
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm cursor-pointer"
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
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm min-h-[80px]"
            placeholder="Detalhes adicionais..."
          />
        </div>

        <Button variant="solid" onClick={handleLocalSave} disabled={!form.amount} className="w-full py-3 text-sm">
          Salvar Transação
        </Button>
      </div>
    );
  };

  return (
    <div className="animate-fade-in duration-500">
      {/* 1. Header de Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
          <List className="text-emerald-500" size={28} />
          Transações
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleOpenImport} className="flex items-center gap-2">
            <Upload size={18} /> Importar OFX
          </Button>
          <Button variant="solid" onClick={() => { setEditingItem(null); setModalType('transaction'); }} className="flex items-center gap-2">
            <Activity size={18} /> Nova Transação
          </Button>
        </div>
      </div>

      {/* 2. Área de Filtros (Filtro Inteligente) */}
      <Card className="p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-zinc-400 mb-1">Busca por descrição</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <InputBase 
              value={searchTerm} 
              onChange={e=>setSearchTerm(e.target.value)} 
              placeholder="Buscar..." 
              className="pl-9 py-2 text-sm"
            />
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-xs text-zinc-400 mb-1">Categoria</label>
          <select 
            value={filterCategory} 
            onChange={e=>setFilterCategory(e.target.value)} 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm appearance-none"
          >
            <option value="" className="bg-zinc-900">Todas as Categorias</option>
            {data.categories.map(c => {
              const config = getCategoryConfig(c.icon);
              return (
                <option key={c.id} value={c.id} className="bg-zinc-900">
                  {config.emoji} {c.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-xs text-zinc-400 mb-1">Fonte</label>
          <select 
            value={filterSource} 
            onChange={e=>setFilterSource(e.target.value)} 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm appearance-none"
          >
            <option value="" className="bg-zinc-900">Todas as Fontes</option>
            <optgroup label="Contas" className="bg-zinc-900 text-zinc-500 text-xs">
              {data.accounts.map(a => <option key={a.id} value={a.id} className="bg-zinc-900 text-white">🏦 {a.name}</option>)}
            </optgroup>
            <optgroup label="Cartões" className="bg-zinc-900 text-zinc-500 text-xs">
              {data.cards.map(c => <option key={c.id} value={c.id} className="bg-zinc-900 text-white">💳 {c.name}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="w-full sm:w-auto flex gap-2">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Data Início</label>
            <input 
              type="date" 
              value={filterDateStart} 
              onChange={e=>setFilterDateStart(e.target.value)} 
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]" 
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Data Fim</label>
            <input 
              type="date" 
              value={filterDateEnd} 
              onChange={e=>setFilterDateEnd(e.target.value)} 
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]" 
            />
          </div>
        </div>

        {(searchTerm || filterCategory || filterSource || filterDateStart || filterDateEnd) && (
          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            <button 
              onClick={()=>{setSearchTerm(''); setFilterCategory(''); setFilterDateStart(''); setFilterDateEnd(''); setFilterSource('');}} 
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-medium text-zinc-300 transition-all w-full sm:w-auto"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </Card>

      {/* 3. Listagem Principal */}
      <Card className="p-0 overflow-hidden mb-8">
        <TransactionTable 
          transactions={txs.map(t => {
            const cat = data.categories.find(c => c.id === t.categoryId);
            return {
              id: t.id,
              date: t.date,
              description: t.description,
              amount: t.amount,
              type: t.type === 'Receita' || t.type === 'Transferência' ? 'income' : 'expense',
              category: cat ? (
                <div className="flex items-center gap-2">
                  <EmojiIcon emoji={cat.icon || '📌'} color={cat.color || 'zinc'} size="sm" />
                  <span className="text-zinc-300 font-medium">{cat.name}</span>
                </div>
              ) : 'Outros',
              raw: t
            };
          })}
          emptyMessage="Nenhuma transação encontrada. Que tal importar seu primeiro arquivo OFX?"
          onEdit={(t) => { setEditingItem(t); setModalType('transaction'); }}
          onDelete={(t) => { setDeleteContext({id: t.id, collection: 'transactions', title: t.description}); setModalType('delete'); }}
        />
      </Card>

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
