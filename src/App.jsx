import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
const {
  Home, Tags, Wallet, CreditCard: CardIcon, Users, List, Plus, Edit2, Trash2,
  AlertTriangle, TrendingUp, TrendingDown, DollarSign, Activity, Check
} = LucideIcons;
import { NumericFormat } from 'react-number-format';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

import { useFinance } from './features/transactions/useFinance';
import DynamicIcon from './shared/components/DynamicIcon';
import Modal from './shared/components/Modal';
import ListHeader from './shared/components/ListHeader';
import AccountCard from './shared/components/AccountCard';
import CreditCard from './shared/components/CreditCard';

export default function FinanceManager() {
  const { data, metrics, loading, utils, operations } = useFinance();
  const { formatMoney, formatDate } = utils;
  const { saveItem, deleteItem } = operations;
  const { totalBalance, monthReceitas, monthDespesas, monthReservas, expensesByCategory, maxExpense, chartData, todayISO } = metrics;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteContext, setDeleteContext] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const showFeedback = (type) => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleSave = async (item, collection) => {
    try {
      await saveItem(item, collection);
      setEditingItem(null);
      setModalType(null);
      showFeedback('success');
    } catch (err) {
      console.error("Erro ao salvar", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteContext) return;
    try {
      await deleteItem(deleteContext.id, deleteContext.collection);
      showFeedback('success');
    } catch (err) {
      console.error("Erro ao excluir", err);
    }
    setDeleteContext(null);
    setModalType(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-400 font-mono">
      <Activity className="animate-spin mr-2"/> Carregando ControlFin v5.5...
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Saldo Total', val: totalBalance, icon: Wallet, color: 'text-white' },
          { label: 'Receitas do Mês', val: monthReceitas, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Reservas do Mês', val: monthReservas, icon: DollarSign, color: 'text-blue-400' },
          { label: 'Despesas do Mês', val: monthDespesas, icon: TrendingDown, color: 'text-rose-400' },
        ].map((card, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <div className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><card.icon size={16}/> {card.label}</div>
            <div className={`text-2xl md:text-3xl font-mono tracking-tight ${card.color}`}>{formatMoney(card.val)}</div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-medium text-emerald-400 mb-6 flex justify-between items-center">
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
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} itemStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="Saldo Projetado" stroke="#71717a" strokeDasharray="5 5" fillOpacity={0} />
              <Area type="monotone" dataKey="Saldo Real" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-medium text-emerald-400 mb-4 flex items-center gap-2"><CardIcon size={18}/> Contas & Cartões</h3>
          <div className="space-y-3">
            {data.accounts.map(a => (
              <AccountCard 
                key={a.id} 
                account={a} 
                balance={a.balance + data.transactions.filter(t=>t.paymentMethod?.id === a.id && t.isPaid !== false).reduce((acc,t)=>acc+(t.type==='Despesa' || t.type==='Reserva'?-t.amount:t.amount),0)} 
                formatMoney={formatMoney}
                onEdit={(item)=> {setEditingItem(item); setModalType('account');}}
                onDelete={(id, title)=> {setDeleteContext({id, collection: 'accounts', title}); setModalType('delete');}}
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

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <h3 className="text-lg font-medium text-emerald-400 mb-4 flex items-center gap-2"><Activity size={18}/> Despesas por Categoria</h3>
          <div className="flex-1 space-y-4">
            {expensesByCategory.map(c => (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-300"><span>{c.icon}</span> {c.name}</div>
                  <div className="font-mono text-zinc-400">{formatMoney(c.total)}</div>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{width: `${(c.total / maxExpense) * 100}%`, backgroundColor: c.color}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const FormCategory = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', type: 'Despesa', icon: '💰', color: '#6366f1' });
    const emojiList = ['📊','📈','💵','🏦','💰','📥','💸','📤','💳','🍕','🏠','💡','🚗','⛽','🏥','🎓','📚','📺','🎧','🎯','🐷'];
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Tipo</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
              <option>Despesa</option><option>Receita</option><option>Reserva</option>
            </select>
          </div>
          <div><label className="block text-xs text-zinc-400 mb-1">Cor</label><input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded border-0 bg-transparent cursor-pointer" /></div>
        </div>
        <div className="flex gap-2 flex-wrap max-h-40 overflow-y-auto p-2 bg-zinc-950 rounded-lg border border-zinc-800 text-2xl">
          {emojiList.map(i => <button key={i} onClick={()=>setForm({...form, icon:i})} className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${form.icon===i ? 'bg-zinc-800 ring-2 ring-emerald-500' : 'hover:bg-zinc-800'}`}>{i}</button>)}
        </div>
        <button onClick={()=>handleSave(form, 'categories')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Categoria</button>
      </div>
    );
  };

  const FormAccount = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', type: 'Corrente', balance: 0, color: '#3b82f6' });
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome (Banco)</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"><option>Corrente</option><option>Poupança</option><option>Digital</option></select></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Cor</label><input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded border-0 bg-transparent cursor-pointer" /></div>
        </div>
        <div><label className="block text-xs text-zinc-400 mb-1">Saldo Inicial (R$)</label><input type="number" step="0.01" value={form.balance} onChange={e=>setForm({...form,balance: parseFloat(e.target.value) || 0})} className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <button onClick={()=>handleSave(form, 'accounts')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Conta</button>
      </div>
    );
  };

  const FormTransaction = ({ item }) => {
    const [form, setForm] = useState(item || {
      description: '', amount: '', type: 'Despesa', date: todayISO,
      categoryId: data.categories[0]?.id || '',
      paymentMethod: { type: 'account', id: data.accounts[0]?.id || '' },
      familyId: '', isPaid: true, isRecurring: false, notes: ''
    });

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
        <div className="flex items-center gap-2 py-2">
            <input type="checkbox" checked={form.isPaid} onChange={e=>setForm({...form, isPaid: e.target.checked})} className="accent-emerald-500" />
            <span className="text-sm text-zinc-300">Efetivado (Pago/Recebido)</span>
        </div>
        <button onClick={()=>handleSave(form, 'transactions')} disabled={!form.amount} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition">Salvar Transação</button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans selection:bg-emerald-500/30">
      <aside className={`bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} fixed md:relative z-40 h-full`}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className={`font-bold text-lg text-emerald-400 flex items-center gap-2 ${!isSidebarOpen && 'hidden'}`}><Activity className="text-emerald-500"/> ControlFin</div>
          <button onClick={()=>setSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-white"><DynamicIcon name={isSidebarOpen?'X':'List'} size={20}/></button>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'transactions', icon: List, label: 'Transações' },
            { id: 'accounts', icon: Wallet, label: 'Contas' },
            { id: 'cards', icon: CardIcon, label: 'Cartões' },
            { id: 'categories', icon: Tags, label: 'Categorias' },
            { id: 'family', icon: Users, label: 'Família' },
          ].map(nav => (
            <button key={nav.id} onClick={() => setActiveTab(nav.id)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === nav.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'} ${!isSidebarOpen && 'justify-center'}`}>
              <nav.icon size={20}/> {isSidebarOpen && <span>{nav.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-6 justify-between">
           <h1 className="text-xl font-medium text-white capitalize">{activeTab}</h1>
           <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm">A</div>
        </header>

        <div className="p-6 max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'transactions' && (
            <div>
              <ListHeader title="Transações" icon={List} onAdd={()=>setModalType('transaction')} />
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden flex flex-col mb-8">
                <div className="p-4 border-b border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950/50">
                  <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Burcar descrição..." className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" />
                  <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"><option value="">Todas Categorias</option>{data.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
                  <button onClick={()=>{setSearchTerm(''); setFilterCategory(''); setFilterDateStart(''); setFilterDateEnd('');}} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition">Limpar Filtros</button>
                </div>
                <div className="p-8 text-center text-zinc-500 italic">As transações serão exibidas aqui... (Refatoração de Tabela pendente no Bloco C)</div>
              </div>
            </div>
          )}
          {activeTab === 'accounts' && (
             <div>
                <ListHeader title="Contas Correntes" icon={Wallet} onAdd={() => { setEditingItem(null); setModalType('account'); }} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.accounts.map(a => <AccountCard key={a.id} account={a} balance={a.balance} formatMoney={formatMoney} onEdit={(i)=>{setEditingItem(i); setModalType('account');}} onDelete={(id,t)=>{setDeleteContext({id,collection:'accounts',title:t}); setModalType('delete');}} />)}
                </div>
             </div>
          )}
           {activeTab === 'cards' && (
             <div>
                <ListHeader title="Cartões de Crédito" icon={CardIcon} onAdd={() => { setEditingItem(null); setModalType('card'); }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.cards.map(c => <CreditCard key={c.id} card={c} variant="full" used={0} formatMoney={formatMoney} onEdit={(i)=>{setEditingItem(i); setModalType('card');}} onDelete={(id,t)=>{setDeleteContext({id,collection:'cards',title:t}); setModalType('delete');}} />)}
                </div>
             </div>
          )}
          {activeTab === 'categories' && (
             <div>
                <ListHeader title="Categorias" icon={Tags} onAdd={() => { setEditingItem(null); setModalType('category'); }} />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {data.categories.map(c => (
                    <div key={c.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group">
                      <div className="flex items-center gap-2"><span>{c.icon}</span> <span className="text-sm">{c.name}</span></div>
                      <button onClick={()=>{setEditingItem(c); setModalType('category');}} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-emerald-400"><Edit2 size={14}/></button>
                    </div>
                  ))}
                </div>
             </div>
          )}
          {activeTab === 'family' && (
             <div>
                <ListHeader title="Família" icon={Users} onAdd={() => { setEditingItem(null); setModalType('family'); }} />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {data.family.map(f => (
                    <div key={f.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 text-center">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">{f.name[0]}</div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-zinc-500">{f.relation}</div>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      </main>

      {modalType === 'category' && <Modal title={editingItem?'Editar':'Nova'} onClose={()=>setModalType(null)}><FormCategory item={editingItem}/></Modal>}
      {modalType === 'account' && <Modal title={editingItem?'Editar':'Nova'} onClose={()=>setModalType(null)}><FormAccount item={editingItem}/></Modal>}
      {modalType === 'transaction' && <Modal title={editingItem?'Editar':'Nova'} onClose={()=>setModalType(null)}><FormTransaction item={editingItem}/></Modal>}
      
      {modalType === 'delete' && (
        <Modal title="Confirmar Exclusão" onClose={()=>setModalType(null)}>
          <div className="p-4 text-center">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <p className="text-zinc-300 mb-6">Deseja excluir <strong>{deleteContext?.title}</strong>?</p>
            <div className="flex gap-4">
              <button onClick={()=>setModalType(null)} className="flex-1 py-2 bg-zinc-800 rounded-lg">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-rose-600 rounded-lg">Excluir</button>
            </div>
          </div>
        </Modal>
      )}

      {feedback && <div className="fixed bottom-8 right-8 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium animate-in slide-in-from-bottom"><Check size={20}/> Operação concluída!</div>}
    </div>
  );
}
