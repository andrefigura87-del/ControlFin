import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
const {
  Home, Tags, Wallet, CreditCard: CardIcon, Users, List, AlertTriangle, Activity, Check, LogOut, Settings
} = LucideIcons;

import { AuthProvider, useAuth } from './core/AuthContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { useFinance, FinanceProvider } from './features/transactions/useFinance';
import DynamicIcon from './shared/components/DynamicIcon';
import EmojiIcon from './shared/components/EmojiIcon';
import Modal from './shared/components/Modal';
import ListHeader from './shared/components/ListHeader';
import AccountCard from './shared/components/AccountCard';
import CreditCard from './shared/components/CreditCard';
import DashboardView from './features/dashboard/DashboardView';
import TransactionsView from './features/transactions/TransactionsView';
import FamilyView from './features/family/FamilyView';
import SettingsView from './features/settings/SettingsView';
import CardsView from './features/cards/CardsView';

function FinanceManager() {
  const { data, metrics, loading, utils, operations } = useFinance();
  const { formatMoney } = utils;
  const { saveItem, deleteItem } = operations;
  const { signOut, user } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteContext, setDeleteContext] = useState(null);
  const [feedback, setFeedback] = useState(null);

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
      <Activity className="animate-spin mr-2"/> Sincronizando com Supabase Cloud...
    </div>
  );

  const FormCategory = ({ item }) => {
    const COLOR_SWATCHES = [
      { id: 'slate', bg: 'bg-slate-500', ring: 'focus:ring-slate-500 ring-slate-500' },
      { id: 'zinc', bg: 'bg-zinc-500', ring: 'focus:ring-zinc-500 ring-zinc-500' },
      { id: 'red', bg: 'bg-red-500', ring: 'focus:ring-red-500 ring-red-500' },
      { id: 'orange', bg: 'bg-orange-500', ring: 'focus:ring-orange-500 ring-orange-500' },
      { id: 'amber', bg: 'bg-amber-500', ring: 'focus:ring-amber-500 ring-amber-500' },
      { id: 'emerald', bg: 'bg-emerald-500', ring: 'focus:ring-emerald-500 ring-emerald-500' },
      { id: 'teal', bg: 'bg-teal-500', ring: 'focus:ring-teal-500 ring-teal-500' },
      { id: 'cyan', bg: 'bg-cyan-500', ring: 'focus:ring-cyan-500 ring-cyan-500' },
      { id: 'blue', bg: 'bg-blue-500', ring: 'focus:ring-blue-500 ring-blue-500' },
      { id: 'indigo', bg: 'bg-indigo-500', ring: 'focus:ring-indigo-500 ring-indigo-500' },
      { id: 'violet', bg: 'bg-violet-500', ring: 'focus:ring-violet-500 ring-violet-500' },
      { id: 'purple', bg: 'bg-purple-500', ring: 'focus:ring-purple-500 ring-purple-500' },
      { id: 'pink', bg: 'bg-pink-500', ring: 'focus:ring-pink-500 ring-pink-500' }
    ];
    
    const emojiGroups = {
      Receita: ['salario', 'reembolso', 'investimentos', '💰', '💵', '📥', '📈'],
      Despesa: ['alimentacao', 'transporte', 'moradia', 'saude', 'mercado', 'educacao', 'lazer', 'vestuario', 'pets', 'viagens', 'academia', 'emprestimo', 'eletrodomesticos', 'internet_telefone', 'assinaturas', '🍔', '🚗', '💊', '💸', '📤'],
      Reserva: ['investimentos', 'cartao_credito', '🏦', '💳', '🤝'],
      Transferência: ['investimentos', '🤝', '🏦', '💳', '🔄', '🔁', '📲', '💸']
    };

    const isHex = item?.color?.startsWith('#');
    const defaultColor = isHex ? 'emerald' : (item?.color || 'emerald');

    const [form, setForm] = useState(item || { 
      name: '', 
      type: 'Despesa', 
      icon: 'alimentacao', 
      color: defaultColor 
    });

    const activeEmojis = emojiGroups[form.type] || emojiGroups['Despesa'];
    const activeSwatch = COLOR_SWATCHES.find(s => s.id === form.color) || COLOR_SWATCHES[5];

    return (
      <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2 block">Nome</label>
            <input 
              autoFocus 
              value={form.name} 
              onChange={e=>setForm({...form,name:e.target.value})} 
              className={`w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm ${activeSwatch.ring}`}
              placeholder="Ex: Mercado"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2 block">Tipo</label>
            <select 
              value={form.type} 
              onChange={e=>setForm({...form,type:e.target.value})} 
              className={`w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm appearance-none ${activeSwatch.ring}`}
            >
              <option>Despesa</option>
              <option>Receita</option>
              <option>Transferência</option>
              <option>Reserva</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-3 p-4 bg-gray-950/50 border border-gray-800/60 rounded-xl">
              {COLOR_SWATCHES.map(swatch => (
                <div 
                  key={swatch.id}
                  onClick={() => setForm({...form, color: swatch.id})}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${swatch.bg}
                    ${form.color === swatch.id ? `ring-2 ring-offset-2 ring-offset-gray-950 scale-110 ${swatch.ring}` : 'opacity-70 hover:opacity-100'}
                  `}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2 block">Ícone</label>
            <div className={`grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-4 bg-gray-950/50 border border-gray-800/60 rounded-xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600 pr-2`}>
              {activeEmojis.map(i => (
                <button 
                  key={i} 
                  onClick={()=>setForm({...form, icon:i})} 
                  className={`aspect-square p-1 rounded-xl flex items-center justify-center transition-all duration-200
                    ${form.icon === i 
                      ? `bg-gray-800 ring-2 shadow-md scale-105 ${activeSwatch.ring}` 
                      : 'hover:bg-gray-800 opacity-70 hover:opacity-100'}
                  `}
                >
                  <EmojiIcon emoji={i} color={form.color} size="md" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={()=>handleSave(form, 'categories')} 
          className={`w-full text-white rounded-xl py-3.5 mt-2 font-medium transition-all shadow-lg active:scale-[0.98] hover:brightness-110 ${activeSwatch.bg}`}
        >
          Salvar Categoria
        </button>
      </div>
    );
  };

  const FormAccount = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', type: 'Corrente', balance: 0, color: '#3b82f6' });
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome (Banco)</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"><option>Corrente</option><option>Poupança</option><option>Investimento</option><option>Benefício</option></select></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Cor</label><input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded border-0 bg-transparent cursor-pointer" /></div>
        </div>
        <div><label className="block text-xs text-zinc-400 mb-1">Saldo Inicial (R$)</label><input type="number" step="0.01" value={form.balance} onChange={e=>setForm({...form,balance: parseFloat(e.target.value) || 0})} className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <button onClick={()=>handleSave(form, 'accounts')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Conta</button>
      </div>
    );
  };

  const FormCard = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', flag: 'Visa', limit: 0, color: '#8b5cf6', digits: '', closingDay: 1, dueDay: 10 });
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome do Cartão/Banco</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Bandeira</label><select value={form.flag} onChange={e=>setForm({...form,flag:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"><option>Visa</option><option>Mastercard</option><option>Elo</option><option>Amex</option></select></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Cor</label><input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded border-0 bg-transparent cursor-pointer" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">4 Últimos Dígitos</label><input type="text" maxLength="4" value={form.digits} onChange={e=>setForm({...form,digits:e.target.value.replace(/\D/g, '')})} placeholder="Ex: 7408" className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Limite (R$)</label><input type="number" step="0.01" value={form.limit} onChange={e=>setForm({...form,limit: parseFloat(e.target.value) || 0})} className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Dia de Fechamento</label><input type="number" min="1" max="31" value={form.closingDay} onChange={e=>setForm({...form,closingDay: parseInt(e.target.value) || 1})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Dia de Vencimento</label><input type="number" min="1" max="31" value={form.dueDay} onChange={e=>setForm({...form,dueDay: parseInt(e.target.value) || 1})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        </div>
        <button onClick={()=>handleSave(form, 'cards')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Cartão</button>
      </div>
    );
  };

  const FormFamily = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', relation: 'Outro' });
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div><label className="block text-xs text-zinc-400 mb-1">Relação</label><input  value={form.relation} onChange={e=>setForm({...form,relation:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <button onClick={()=>handleSave(form, 'family')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Familiar</button>
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
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map(nav => (
            <button key={nav.id} onClick={() => setActiveTab(nav.id)} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === nav.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'} ${!isSidebarOpen && 'justify-center'}`}>
              <nav.icon size={20}/> {isSidebarOpen && <span>{nav.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-800">
           <button onClick={signOut} className={`w-full flex items-center gap-3 p-3 rounded-xl text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all ${!isSidebarOpen && 'justify-center'}`}>
             <LogOut size={20}/> {isSidebarOpen && <span>Sair</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-6 justify-between">
           <div className="flex items-center gap-4">
              <h1 className="text-xl font-medium text-white capitalize">{activeTab}</h1>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 hidden md:block">{user?.email}</span>
              <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm">{user?.email[0].toUpperCase()}</div>
           </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView 
              onEditAccount={(i)=>{setEditingItem(i); setModalType('account');}} 
              onDeleteAccount={(id,t)=>{setDeleteContext({id,collection:'accounts',title:t}); setModalType('delete');}} 
            />
          )}

          {activeTab === 'transactions' && <TransactionsView />}

          {activeTab === 'accounts' && (
             <div>
                <ListHeader title="Contas Correntes" icon={Wallet} onAdd={() => { setEditingItem(null); setModalType('account'); }} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {metrics.enrichedAccounts.map(a => <AccountCard key={a.id} account={a} balance={a.currentBalance} formatMoney={formatMoney} onEdit={(i)=>{setEditingItem(i); setModalType('account');}} onDelete={(id,t)=>{setDeleteContext({id,collection:'accounts',title:t}); setModalType('delete');}} />)}
                </div>
             </div>
          )}
           {activeTab === 'cards' && <CardsView />}
          {activeTab === 'categories' && (
             <div>
                <ListHeader title="Categorias" icon={Tags} onAdd={() => { setEditingItem(null); setModalType('category'); }} />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {data.categories.map(c => (
                    <div key={c.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <EmojiIcon emoji={c.icon || '📌'} color={c.color || 'zinc'} size="md" />
                        <span className="text-sm font-medium text-zinc-200">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>{setEditingItem(c); setModalType('category');}} className="p-1.5 rounded-md text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"><LucideIcons.Edit2 size={14}/></button>
                        <button onClick={()=>{setDeleteContext({id:c.id, collection:'categories', title:c.name}); setModalType('delete');}} className="p-1.5 rounded-md text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"><LucideIcons.Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
          {activeTab === 'family' && (
            <FamilyView 
              onAdd={() => { setEditingItem(null); setModalType('family'); }}
              onEdit={(item) => { setEditingItem(item); setModalType('family'); }}
              onDelete={(id, title) => { setDeleteContext({ id, collection: 'family', title }); setModalType('delete'); }}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </div>
      </main>

      {modalType === 'category' && <Modal title={editingItem?'Editar':'Nova'} onClose={()=>setModalType(null)}><FormCategory item={editingItem}/></Modal>}
      {modalType === 'account' && <Modal title={editingItem?'Editar':'Nova'} onClose={()=>setModalType(null)}><FormAccount item={editingItem}/></Modal>}
      {modalType === 'card' && <Modal title={editingItem?'Editar':'Novo'} onClose={()=>setModalType(null)}><FormCard item={editingItem}/></Modal>}
      {modalType === 'family' && <Modal title={editingItem?'Editar':'Novo'} onClose={()=>setModalType(null)}><FormFamily item={editingItem}/></Modal>}
      
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

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <FinanceProvider>
          <FinanceManager />
        </FinanceProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
