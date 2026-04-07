import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
const {
  Home, Tags, Wallet, CreditCard, Users, List, Plus, Edit2, Trash2,
  X, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Activity, Settings, User, Building, Search, Filter, Check, HelpCircle
} = LucideIcons;
import { NumericFormat } from 'react-number-format';

const DynamicIcon = ({ name, size = 20, color, ...props }) => {
  const Icon = name && LucideIcons[name] ? LucideIcons[name] : HelpCircle;
  return <Icon size={size} color={color} {...props} />;
};

const BANK_BRANDING = {
  'PagBank': 'bg-gradient-to-r from-[#F5DE3E] via-[#1BB99A] to-[#94CEE4] text-zinc-900 border-none shadow-xl shadow-[#1BB99A]/10',
  'Santander': 'bg-gradient-to-r from-[#EC0000] to-[#EA1D25] text-white border-none shadow-xl shadow-[#EC0000]/10',
  'Nubank': 'bg-gradient-to-r from-[#820AD1] to-[#61079D] text-white border-none shadow-xl shadow-[#820AD1]/10',
  'Bradesco': 'bg-gradient-to-r from-[#CC092F] to-[#FD0D3B] text-white border-none shadow-xl shadow-[#CC092F]/10',
  'Neon': 'bg-gradient-to-r from-[#00E5FF] to-[#00A7D3] text-zinc-900 border-none shadow-xl shadow-[#00E5FF]/10',
  'Itaú': 'bg-gradient-to-r from-[#EC7000] to-[#FF8C00] text-white border-none shadow-xl shadow-[#EC7000]/10'
};

const getBrandStyle = (name) => {
  const key = Object.keys(BANK_BRANDING).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? BANK_BRANDING[key] : 'bg-zinc-800/50 border border-zinc-800/50 text-white';
};

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const generateId = () => Math.random().toString(36).substr(2, 9);

// SEED DATA
export default function FinanceManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    categories: [],
    accounts: [],
    cards: [],
    family: [],
    transactions: []
  });

  // FILTERS STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFamily, setFilterFamily] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cat, acc, card, fam, trans] = await Promise.all([
          fetch('http://localhost:5000/categories').then(r => r.json()),
          fetch('http://localhost:5000/accounts').then(r => r.json()),
          fetch('http://localhost:5000/cards').then(r => r.json()),
          fetch('http://localhost:5000/family').then(r => r.json()),
          fetch('http://localhost:5000/transactions').then(r => r.json()),
        ]);
        setData({ categories: cat, accounts: acc, cards: card, family: fam, transactions: trans });
      } catch (err) {
        console.error("Erro ao carregar banco local", err);
      }
    };
    fetchData();
  }, []);

  // UI STATE
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [modalType, setModalType] = useState(null); // 'category', 'account', 'card', 'family', 'transaction', 'delete'
  const [editingItem, setEditingItem] = useState(null);
  const [deleteContext, setDeleteContext] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg: string }

  // HELPERS
  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '';

  const showFeedback = (type) => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 1000);
  };

  const handleSave = async (item, collection) => {
    try {
      const isTransaction = collection === 'transactions';
      if (item.id) {
        if (isTransaction && item.groupId) {
          const applyToFuture = window.confirm("Esta é uma transação recorrente. Deseja aplicar as alterações apenas nesta ou em todas as futuras parcelas deste grupo?");
          if (applyToFuture) {
             const groupId = item.groupId;
             const itemDate = new Date(item.date);
             const siblings = data.transactions.filter(t => t.groupId === groupId && new Date(t.date) >= itemDate && t.id !== item.id);
             const operations = [];
             
             const { isRecurring, ...baseOp } = item;
             const reqBase = fetch(`http://localhost:5000/${collection}/${item.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(baseOp) }).then(r=>r.json());
             operations.push(reqBase);

             siblings.forEach((sib) => {
               // Parcels futuras SEMPRE isPaid: false por padrão no hotfix se mudar algo? 
               // O usuário disse: "Apenas a primeira parcela... deve herdar o estado... force as parcelas geradas no loop... a terem isPaid: false"
               // Para edições, se ele editou o valor/descrição, propagamos, mas mantemos o isPaid do irmão original ou forçamos false?
               // Geralmente se ele tá editando uma futura, pode querer mudar o valor de todas.
               const payload = { ...baseOp, id: sib.id, date: sib.date, isPaid: sib.isPaid }; // Mantém isPaid original do irmão
               const reqSib = fetch(`http://localhost:5000/${collection}/${sib.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) }).then(r=>r.json());
               operations.push(reqSib);
             });
             
             const savedOps = await Promise.all(operations);
             setData(prev => {
                let updatedList = [...prev[collection]];
                savedOps.forEach(op => {
                   updatedList = updatedList.map(x => x.id === op.id ? op : x);
                });
                return { ...prev, [collection]: updatedList };
             });
          } else {
            const { isRecurring, ...payload } = item;
            const res = await fetch(`http://localhost:5000/${collection}/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const updated = await res.json();
            setData(prev => ({ ...prev, [collection]: prev[collection].map(i => i.id === updated.id ? updated : i) }));
          }
        } else if (isTransaction && item.isRecurring) {
           // Caso ele transformou uma avulsa em recorrente agora
           const groupId = crypto.randomUUID();
           const { isRecurring, ...baseOp } = item;
           const operations = [];
           const reqBase = fetch(`http://localhost:5000/${collection}/${item.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ ...baseOp, groupId }) }).then(r=>r.json());
           operations.push(reqBase);

           for(let i=1; i<12; i++) {
             let d = new Date(baseOp.date);
             d.setUTCMonth(d.getUTCMonth() + i);
             const loopItem = { ...baseOp, id: generateId(), groupId, date: d.toISOString().split('T')[0], isPaid: false };
             const req = fetch(`http://localhost:5000/${collection}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(loopItem) }).then(r=>r.json());
             operations.push(req);
           }
           const savedOps = await Promise.all(operations);
           setData(prev => ({ ...prev, [collection]: [...savedOps, ...prev[collection].filter(x => x.id !== item.id)] }));
        } else {
          // Normal PUT
          const { isRecurring, ...payload } = item;
          const res = await fetch(`http://localhost:5000/${collection}/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          const updated = await res.json();
          setData(prev => ({ ...prev, [collection]: prev[collection].map(i => i.id === updated.id ? updated : i) }));
        }
      } else {
        if (isTransaction && item.isRecurring) {
          const { isRecurring, ...baseOp } = item;
          const groupId = crypto.randomUUID();
          const operations = [];
          for(let i=0; i<12; i++) {
             let d = new Date(baseOp.date);
             d.setUTCMonth(d.getUTCMonth() + i);
             // HOTFIX: Apenas a primeira (i=0) herda o isPaid do formulário. As outras são false.
             const loopItem = { ...baseOp, id: generateId(), groupId, date: d.toISOString().split('T')[0], isPaid: i === 0 ? baseOp.isPaid : false };
             const req = fetch(`http://localhost:5000/${collection}`, {
               method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loopItem)
             }).then(r => r.json());
             operations.push(req);
          }
          const savedOps = await Promise.all(operations);
          setData(prev => ({ ...prev, [collection]: [...savedOps.reverse(), ...prev[collection]] }));
        } else {
          const { isRecurring, ...payload } = item;
          const res = await fetch(`http://localhost:5000/${collection}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: generateId() })
          });
          const saved = await res.json();
          setData(prev => ({ ...prev, [collection]: [saved, ...prev[collection]] }));
        }
      }
      setEditingItem(null);
      setModalType(null);
      showFeedback('success');
    } catch (err) {
      console.error("Erro ao salvar", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteContext) return;
    const { id, collection, groupId } = deleteContext;
    if (collection === 'categories' && data.transactions.some(t => t.categoryId === id)) {
      alert("Não é possível excluir categoria em uso.");
      setDeleteContext(null);
      setModalType(null);
      return;
    }
    try {
      if (collection === 'transactions' && groupId) {
        const deleteAll = window.confirm(`Esta transação faz parte de uma recorrência.\nDeseja apagar TODAS as parcelas deste grupo?\n(Aperte OK para TODAS, ou Cancelar para apagar APENAS ESTA)`);
        if (deleteAll) {
          const siblings = data.transactions.filter(t => t.groupId === groupId);
          await Promise.all(siblings.map(sib => fetch(`http://localhost:5000/transactions/${sib.id}`, { method: 'DELETE' })));
          setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.groupId !== groupId) }));
          showFeedback('success');
          setDeleteContext(null);
          setModalType(null);
          return;
        }
      }

      await fetch(`http://localhost:5000/${collection}/${id}`, { method: 'DELETE' });
      setData(prev => ({ ...prev, [collection]: prev[collection].filter(i => i.id !== id) }));
      showFeedback('success');
    } catch (err) {
      console.error("Erro ao excluir", err);
    }
    setDeleteContext(null);
    setModalType(null);
  };

  // GENERIC MODAL
  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-medium text-emerald-400">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition"><X size={20}/></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  // DASHBOARD CALCULATIONS
  const totalBalance = data.accounts.reduce((acc, a) => acc + a.balance, 0) + 
    data.transactions.filter(t => t.type === 'Receita' && t.paymentMethod?.type === 'account' && t.isPaid !== false).reduce((acc, t) => acc + t.amount, 0) -
    data.transactions.filter(t => (t.type === 'Despesa' || t.type === 'Reserva') && t.paymentMethod?.type === 'account' && t.isPaid !== false).reduce((acc, t) => acc + t.amount, 0) +
    data.transactions.filter(t => t.type === 'Reserva' && t.destinationAccountId && t.isPaid !== false).reduce((acc, t) => acc + t.amount, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTransactions = data.transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const todayISO = new Date().toISOString().split('T')[0];

  const monthReceitas = monthTransactions.filter(t => t.type === 'Receita' && (t.isPaid !== false || t.date <= todayISO)).reduce((a, t) => a + t.amount, 0);
  const monthDespesas = monthTransactions.filter(t => t.type === 'Despesa' && (t.isPaid !== false || t.date <= todayISO)).reduce((a, t) => a + t.amount, 0);
  const monthReservas = monthTransactions.filter(t => t.type === 'Reserva' && (t.isPaid !== false || t.date <= todayISO)).reduce((a, t) => a + t.amount, 0);

  const expensesByCategory = data.categories.filter(c => c.type === 'Despesa').map(c => {
    const total = monthTransactions.filter(t => t.categoryId === c.id && t.type === 'Despesa' && t.date <= todayISO).reduce((a,t) => a + t.amount, 0);
    return { ...c, total };
  }).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const maxExpense = expensesByCategory.length ? Math.max(...expensesByCategory.map(c => c.total)) : 1;

  // RECHARTS DATA PREP (DIÁRIO)
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const days = getDaysInMonth(currentMonth, currentYear);
  const chartData = [];
  let runningReal = data.accounts.reduce((acc, a) => acc + a.balance, 0);
  let runningProjected = runningReal;

  // Saldo Inicial (Transações passadas já efetivadas)
  const pastTransactions = data.transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d < new Date(currentYear, currentMonth, 1);
  });
  
  pastTransactions.forEach(t => {
    const val = t.type === 'Receita' ? t.amount : -t.amount;
    if (t.isPaid !== false) runningReal += val;
    runningProjected += val;
  });

  for (let i = 1; i <= days; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayTxs = monthTransactions.filter(t => t.date === dateStr);
    
    dayTxs.forEach(t => {
      const val = t.type === 'Receita' ? t.amount : -t.amount;
      if (t.isPaid !== false) runningReal += val;
      runningProjected += val;
    });

    chartData.push({
      day: i,
      'Saldo Real': parseFloat(runningReal.toFixed(2)),
      'Saldo Projetado': parseFloat(runningProjected.toFixed(2))
    });
  }

  // VIEWS
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><Wallet size={16}/> Saldo Total</div>
          <div className="text-3xl font-mono tracking-tight text-white">{formatMoney(totalBalance)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400"/> Receitas do Mês</div>
          <div className="text-2xl font-mono text-emerald-400">{formatMoney(monthReceitas)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><DollarSign size={16} className="text-blue-400"/> Reservas do Mês</div>
          <div className="text-2xl font-mono text-blue-400">{formatMoney(monthReservas)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="text-zinc-400 text-sm mb-1 flex items-center gap-2"><TrendingDown size={16} className="text-rose-400"/> Despesas do Mês</div>
          <div className="text-2xl font-mono text-rose-400">{formatMoney(monthDespesas)}</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-medium text-emerald-400 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2"><Activity size={18}/> Evolução de Liquidez Diária</div>
          <div className="text-xs font-normal text-zinc-500 uppercase tracking-widest">Mês Corrente</div>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#71717a" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="Saldo Projetado" stroke="#71717a" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProj)" />
              <Area type="monotone" dataKey="Saldo Real" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-medium text-emerald-400 mb-4 flex items-center gap-2"><CreditCard size={18}/> Contas & Cartões</h3>
          <div className="space-y-3">
            {data.accounts.map(a => {
              const currentBal = a.balance + 
                data.transactions.filter(t => t.paymentMethod?.type === 'account' && t.paymentMethod.id === a.id && t.isPaid !== false)
                .reduce((acc, t) => acc + (t.type === 'Despesa' || t.type === 'Reserva' ? -t.amount : t.amount), 0) +
                data.transactions.filter(t => t.type === 'Reserva' && t.destinationAccountId === a.id && t.isPaid !== false)
                .reduce((acc, t) => acc + t.amount, 0);

              const brandClass = getBrandStyle(a.name);
              const isBranded = !brandClass.includes('bg-zinc-800');
              
              return (
                <div key={a.id} className={`flex justify-between items-center p-3 rounded-xl ${brandClass}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isBranded ? 'bg-black/20 backdrop-blur-sm' : ''}`} style={isBranded ? {} : {backgroundColor: a.color + '20', color: a.color}}>
                       {isBranded ? <Building size={16}/> : a.name[0]}
                    </div>
                    <div>
                      <div className={`font-medium ${isBranded ? 'text-inherit opacity-90' : 'text-zinc-200'}`}>{a.name}</div>
                      <div className={`text-xs ${isBranded ? 'text-inherit opacity-70' : 'text-zinc-500'}`}>{a.type}</div>
                    </div>
                  </div>
                  <div className={`font-mono ${isBranded ? 'text-inherit' : 'text-zinc-300'}`}>{formatMoney(currentBal)}</div>
                </div>
              );
            })}
            {data.cards.map(c => {
               const used = data.transactions.filter(t => t.paymentMethod?.type === 'card' && t.paymentMethod.id === c.id && t.type === 'Despesa' && t.date <= todayISO)
                            .reduce((acc, t) => acc + t.amount, 0);
               return (
                <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-800/50 border border-zinc-800/50">
                   <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: c.color + '20', color: c.color}}><CreditCard size={18}/></div>
                    <div><div className="font-medium text-zinc-200">{c.name}</div><div className="text-xs font-mono text-zinc-500">•••• {c.digits}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-rose-400 text-sm">{formatMoney(used)} <span className="text-zinc-600">usado</span></div>
                    <div className="font-mono text-emerald-400 text-xs">{formatMoney(c.limit - used)} <span className="text-zinc-600">disp.</span></div>
                  </div>
                </div>
               )
            })}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <h3 className="text-lg font-medium text-emerald-400 mb-4 flex items-center gap-2"><Activity size={18}/> Despesas por Categoria</h3>
          <div className="flex-1 space-y-4">
            {expensesByCategory.length === 0 ? <p className="text-zinc-500 text-center py-4">Nenhuma despesa neste mês.</p> :
             expensesByCategory.map(c => (
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2"><List size={18}/> Últimas Transações</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {data.transactions.slice(0, 5).map(t => {
            const cat = data.categories.find(c => c.id === t.categoryId);
            const fam = data.family.find(f => f.id === t.familyId);
            return (
              <div key={t.id} className="p-4 flex justify-between items-center hover:bg-zinc-800/30 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-zinc-800" style={{color: cat?.color}}>{cat?.icon || '📦'}</div>
                  <div>
                    <div className="font-medium text-zinc-200">{t.description}</div>
                    <div className="text-xs text-zinc-500 flex gap-2 items-center mt-1">
                      <span>{formatDate(t.date)}</span>
                      {fam && <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{fam.name}</span>}
                    </div>
                  </div>
                </div>
                <div className={`font-mono ${t.type === 'Receita' ? 'text-emerald-400' : t.type === 'Reserva' ? 'text-blue-400' : 'text-rose-400'}`}>
                  {t.type === 'Despesa' ? '-' : '+'}{formatMoney(t.amount)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );

  // LIST & CRUD VIEWS
  const ListHeader = ({ title, icon: Icon, onAdd }) => (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-medium text-white flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><Icon size={24}/></div>
        {title}
      </h2>
      <button onClick={onAdd} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 font-medium">
        <Plus size={18}/> Novo
      </button>
    </div>
  );

  const FormCategory = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', type: 'Despesa', icon: '💰', color: '#6366f1' });
    
    // Lista de Emojis baseados nas categorias do usuário
    const emojiList = ['📊','📈','💵','🏦','💰','📥','💸','📤','💳','💹','💎','🛒','🍕','🏠','💡','🚗','⛽','✈️','🍿','💊','🏥','🎓','📚','📺','🎧','🎯','📌','🐷','🪙','📄','🧾','📅','🔮','⚠️','🔔','⚙️','🛠️','🔒','🛡️','👤','💬','❓'];

    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Tipo</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
              <option>Despesa</option><option>Receita</option><option>Reserva</option>
            </select>
          </div>
          <div><label className="block text-xs text-zinc-400 mb-1">Cor</label>
            <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded border-0 bg-transparent cursor-pointer" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-2">Ícone da Categoria</label>
          <div className="flex gap-2 flex-wrap max-h-40 overflow-y-auto p-2 bg-zinc-950 rounded-lg border border-zinc-800 text-2xl">
            {emojiList.map(i => (
              <button key={i} onClick={()=>setForm({...form, icon:i, iconName: null})} className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${form.icon===i ? 'bg-zinc-800 ring-2 ring-emerald-500' : 'hover:bg-zinc-800'}`}>
                 {i}
              </button>
            ))}
          </div>
        </div>
        <button onClick={()=>{
           // Limpa o iconName legado para forçar o Emoji
           const payload = { ...form };
           if (payload.iconName) delete payload.iconName;
           handleSave(payload, 'categories');
        }} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Categoria</button>
      </div>
    )
  };

  const renderCategories = () => (
    <div>
      <ListHeader title="Categorias" icon={Tags} onAdd={() => { setEditingItem(null); setModalType('category'); }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.categories.map(c => (
          <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between group hover:border-zinc-700 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-zinc-800" style={{color: c.color}}>
                {c.icon || (c.iconName ? <DynamicIcon name={c.iconName} size={20} /> : '📦')}
              </div>
              <div>
                <div className="font-medium text-zinc-200">{c.name}</div>
                <div className="text-xs text-zinc-500">{c.type}</div>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={()=>{setEditingItem(c); setModalType('category');}} className="p-2 text-zinc-400 hover:text-emerald-400 bg-zinc-800/50 rounded-lg"><Edit2 size={16}/></button>
              <button onClick={()=>{setDeleteContext({id: c.id, collection: 'categories', title: c.name}); setModalType('delete');}} className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-800/50 rounded-lg"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const FormAccount = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', type: 'Corrente', balance: 0, color: '#3b82f6' });
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome do Banco</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Tipo</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
              <option>Corrente</option><option>Poupança</option><option>Digital</option>
            </select>
          </div>
          <div><label className="block text-xs text-zinc-400 mb-1">Cor</label>
            <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded border-0 bg-transparent cursor-pointer" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Saldo Inicial (R$)</label>
          <input type="number" step="0.01" value={form.balance} onChange={e=>setForm({...form,balance: parseFloat(e.target.value) || 0})} className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
        </div>
        <button onClick={()=>handleSave(form, 'accounts')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Conta</button>
      </div>
    )
  };

  const renderAccounts = () => (
    <div>
      <ListHeader title="Contas Correntes" icon={Wallet} onAdd={() => { setEditingItem(null); setModalType('account'); }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.accounts.map(a => {
          const currentBal = a.balance + 
            data.transactions.filter(t=>t.paymentMethod?.id === a.id && t.isPaid !== false).reduce((acc,t)=>acc+(t.type==='Despesa' || t.type==='Reserva'?-t.amount:t.amount),0) +
            data.transactions.filter(t => t.type === 'Reserva' && t.destinationAccountId === a.id && t.isPaid !== false).reduce((acc, t) => acc + t.amount, 0);
          
          const brandClass = getBrandStyle(a.name);
          const isBranded = !brandClass.includes('bg-zinc-800');

          return (
          <div key={a.id} className={`${isBranded ? brandClass : 'bg-zinc-900 border border-zinc-800'} rounded-2xl p-5 group hover:opacity-90 transition relative overflow-hidden`}>
            {!isBranded && <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 pointer-events-none" style={{backgroundColor: a.color}}></div>}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex gap-3 items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${isBranded ? 'bg-black/20 backdrop-blur-sm shadow-inner' : 'bg-zinc-950 border border-zinc-800 text-zinc-200'}`} style={!isBranded ? {borderLeftColor: a.color, borderLeftWidth: 4} : {}}>
                  <Building size={20} className={isBranded ? 'text-inherit opacity-80' : 'text-zinc-500'}/>
                </div>
                <div>
                  <div className={`font-medium text-lg ${isBranded ? 'text-inherit' : 'text-white'}`}>{a.name}</div>
                  <div className={`text-xs ${isBranded ? 'text-inherit opacity-70' : 'text-zinc-500'}`}>{a.type}</div>
                </div>
              </div>
               <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition rounded-lg p-1 shadow ${isBranded ? 'bg-black/20 backdrop-blur-md' : 'bg-zinc-950 border border-zinc-800'}`}>
                <button onClick={()=>{setEditingItem(a); setModalType('account');}} className={`p-1.5 rounded hover:bg-black/20 ${isBranded ? 'text-inherit' : 'text-zinc-400 hover:text-emerald-400'}`}><Edit2 size={14}/></button>
                <button onClick={()=>{setDeleteContext({id: a.id, collection: 'accounts', title: a.name}); setModalType('delete');}} className={`p-1.5 rounded ${isBranded ? 'text-inherit hover:text-red-900' : 'text-zinc-400 hover:text-rose-400'}`}><Trash2 size={14}/></button>
              </div>
            </div>
            <div>
              <div className={`text-xs mb-1 ${isBranded ? 'text-inherit opacity-70' : 'text-zinc-500'}`}>Saldo Atual</div>
              <div className={`text-2xl font-mono ${isBranded ? 'text-inherit' : 'text-zinc-200'}`}>{formatMoney(currentBal)}</div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );

  const FormCard = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', flag: 'Master', digits: '', limit: 1000, closingDay: 1, dueDay: 10, color: '#ec4899' });
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Apelido do Cartão</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Bandeira</label>
            <select value={form.flag} onChange={e=>setForm({...form,flag:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
              <option>Visa</option><option>Master</option><option>Elo</option><option>Amex</option>
            </select>
          </div>
          <div><label className="block text-xs text-zinc-400 mb-1">Últimos 4 Dígitos</label>
            <input maxLength={4} value={form.digits} onChange={e=>setForm({...form,digits:e.target.value.replace(/\D/g,'')})} className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" placeholder="0000"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Dia Fechamento</label><input type="number" min="1" max="31" value={form.closingDay} onChange={e=>setForm({...form,closingDay:parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Dia Vencimento</label><input type="number" min="1" max="31" value={form.dueDay} onChange={e=>setForm({...form,dueDay:parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Limite Total (R$)</label><input type="number" value={form.limit} onChange={e=>setForm({...form,limit:parseFloat(e.target.value)||0})} className="font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Cor Base</label><input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="w-full h-10 rounded border-0 bg-transparent cursor-pointer" /></div>
        </div>
        <button onClick={()=>handleSave(form, 'cards')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Cartão</button>
      </div>
    )
  };

  const renderCards = () => (
    <div>
      <ListHeader title="Cartões de Crédito" icon={CreditCard} onAdd={() => { setEditingItem(null); setModalType('card'); }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.cards.map(c => {
          const used = data.transactions.filter(t => t.paymentMethod?.id === c.id && t.date <= todayISO).reduce((acc,t)=>acc+t.amount,0);
          return (
            <div key={c.id} className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 mix-blend-overlay rounded-full blur-2xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 pointer-events-none" style={{backgroundColor: c.color}}></div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="text-zinc-400 text-sm">{c.flag}</div>
                  <div className="font-medium text-xl text-white mt-1">{c.name}</div>
                </div>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={()=>{setEditingItem(c); setModalType('card');}} className="p-2 bg-zinc-950/50 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition"><Edit2 size={16}/></button>
                  <button onClick={()=>{setDeleteContext({id: c.id, collection: 'cards', title: c.name}); setModalType('delete');}} className="p-2 bg-zinc-950/50 hover:bg-rose-500/20 rounded-lg text-zinc-400 hover:text-rose-400 transition"><Trash2 size={16}/></button>
                </div>
              </div>
              <div className="font-mono text-2xl tracking-widest text-zinc-300 mb-6 drop-shadow-sm">•••• •••• •••• {c.digits || '0000'}</div>
              <div className="flex justify-between items-end">
                <div><div className="text-xs text-zinc-500 mb-1">Fechamento / Venc.</div><div className="text-sm font-mono text-zinc-300">{c.closingDay} / {c.dueDay}</div></div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 mb-1">Disponível</div>
                  <div className="text-xl font-mono text-emerald-400">{formatMoney(c.limit - used)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  const FormFamily = ({ item }) => {
    const [form, setForm] = useState(item || { name: '', relation: 'Outro' });
    return (
      <div className="space-y-4">
        <div><label className="block text-xs text-zinc-400 mb-1">Nome</label><input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" /></div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Parentesco</label>
          <select value={form.relation} onChange={e=>setForm({...form,relation:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
            <option>Titular</option><option>Cônjuge</option><option>Filho/a</option><option>Pai</option><option>Mãe</option><option>Outro</option>
          </select>
        </div>
        <button onClick={()=>handleSave(form, 'family')} className="w-full bg-emerald-500 text-white rounded-lg py-2 mt-4 font-medium hover:bg-emerald-600 transition">Salvar Familiar</button>
      </div>
    )
  };

  const renderFamily = () => (
    <div>
      <ListHeader title="Familiares" icon={Users} onAdd={() => { setEditingItem(null); setModalType('family'); }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.family.map(f => {
          const despesas = monthTransactions.filter(t => t.familyId === f.id && t.type === 'Despesa' && (t.isPaid !== false || t.date <= todayISO)).reduce((a, t) => a + t.amount, 0);
          return (
            <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center group hover:border-zinc-700 transition relative">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition relative z-10">
                <button onClick={()=>{setEditingItem(f); setModalType('family');}} className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded"><Edit2 size={12}/></button>
                <button onClick={()=>{setDeleteContext({id: f.id, collection: 'family', title: f.name}); setModalType('delete');}} className="p-1.5 text-zinc-400 hover:text-rose-400 bg-zinc-800 rounded"><Trash2 size={12}/></button>
              </div>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl font-bold mx-auto mb-3 border border-emerald-500/20 shadow-inner">
                {f.name[0]?.toUpperCase()}
              </div>
              <div className="font-medium text-white text-lg">{f.name}</div>
              <div className="text-xs text-zinc-500 mb-4">{f.relation}</div>
              <div className="pt-3 border-t border-zinc-800">
                <div className="text-xs text-zinc-500">Despesas Atribuídas</div>
                <div className="font-mono text-rose-400 font-medium">{formatMoney(despesas)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  const FormTransaction = ({ item }) => {
    const [form, setForm] = useState(item || {
      description: '', amount: '', type: 'Despesa', date: new Date().toISOString().split('T')[0],
      categoryId: data.categories[0]?.id || '',
      paymentMethod: { type: 'account', id: data.accounts[0]?.id || '' },
      familyId: '', isPaid: true, isRecurring: false, notes: ''
    });

    const handleDeleteClick = () => {
      if (item) {
        setDeleteContext({ id: item.id, collection: 'transactions', title: item.description, groupId: item.groupId });
        setModalType('delete');
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-zinc-950 rounded-lg">
          <button onClick={()=>setForm({...form, type: 'Despesa'})} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${form.type === 'Despesa' ? 'bg-rose-500/10 text-rose-400' : 'text-zinc-500 hover:bg-zinc-900'}`}>Despesa</button>
          <button onClick={()=>setForm({...form, type: 'Receita'})} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${form.type === 'Receita' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:bg-zinc-900'}`}>Receita</button>
          <button onClick={()=>setForm({...form, type: 'Reserva'})} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${form.type === 'Reserva' ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-500 hover:bg-zinc-900'}`}>Reserva</button>
        </div>
        <div><label className="block text-xs text-zinc-400 mb-1">Descrição</label><input autoFocus value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" placeholder="Ex: Mercado Anual" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Valor</label>
            <NumericFormat 
              value={form.amount} 
              onValueChange={(values) => setForm({...form, amount: values.floatValue})} 
              prefix="R$ " 
              thousandSeparator="." 
              decimalSeparator="," 
              decimalScale={2} 
              fixedDecimalScale 
              className={`font-mono w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 ${form.type === 'Despesa' ? 'text-rose-400': form.type === 'Reserva' ? 'text-blue-400' : 'text-emerald-400'}`} 
              placeholder="R$ 0,00" 
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Data</label>
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setForm({...form, isPaid: !form.isPaid})} 
                  className={`relative w-9 h-5 rounded-full transition-colors ${form.isPaid ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isPaid ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
                <span className="text-sm text-zinc-300">Efetivado</span>
              </div>
            </div>
            {(!item || !item.groupId) && (
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={form.isRecurring || false} onChange={e => setForm({...form, isRecurring: e.target.checked})} className="accent-emerald-500 w-4 h-4 rounded border-zinc-700 bg-zinc-900"/>
                <span className="text-sm text-zinc-300">Repetir mensalmente</span>
              </label>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {form.type !== 'Reserva' ? (
            <div><label className="block text-xs text-zinc-400 mb-1">Categoria</label>
              <select value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
                {data.categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.icon || '📦'} {c.name}</option>)}
              </select>
            </div>
          ) : (
            <div><label className="block text-xs text-zinc-400 mb-1">Destino (Entrada)</label>
              <select value={form.destinationAccountId} onChange={e=>setForm({...form,destinationAccountId:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
                <option value="">Selecione o destino</option>
                {data.accounts.map(a => <option key={a.id} value={a.id}>💳 {a.name}</option>)}
              </select>
            </div>
          )}
          <div><label className="block text-xs text-zinc-400 mb-1">{form.type === 'Reserva' ? 'Origem (Saída)' : 'Pago em'}</label>
            <select value={JSON.stringify(form.paymentMethod)} onChange={e=>setForm({...form,paymentMethod:JSON.parse(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
              <optgroup label="Contas">
                {data.accounts.map(a => <option key={a.id} value={JSON.stringify({type:'account',id:a.id})}>💳 {a.name}</option>)}
              </optgroup>
              <optgroup label="Cartões">
                {data.cards.map(c => <option key={c.id} value={JSON.stringify({type:'card',id:c.id})}>💳 {c.name}</option>)}
              </optgroup>
            </select>
          </div>
        </div>
        <div><label className="block text-xs text-zinc-400 mb-1">Familiar (Opcional)</label>
          <select value={form.familyId} onChange={e=>setForm({...form,familyId:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500">
            <option value="">Nenhum</option>
            {data.family.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Observações (Opcional)</label>
          <textarea value={form.notes || ''} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 resize-none h-16" placeholder="Insira detalhes adicionais aqui..."></textarea>
        </div>
        <div className="flex gap-3">
          {item && (
            <button onClick={handleDeleteClick} className="px-4 py-3 bg-zinc-800 text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-zinc-700">
              <Trash2 size={20}/>
            </button>
          )}
          <button onClick={()=>handleSave(form, 'transactions')} disabled={!form.amount} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-emerald-500/20">
            Salvar Transação
          </button>
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    const handleExportCSV = () => {
      const filtered = getFilteredTransactions();
      const headers = ['Data', 'Descricao', 'Categoria', 'Fonte', 'Familiar', 'Valor', 'Status'];
      const rows = filtered.map(t => {
        const cat = data.categories.find(c => c.id === t.categoryId);
        const fam = data.family.find(f => f.id === t.familyId);
        const source = t.paymentMethod.type === 'account' ? data.accounts.find(a=>a.id===t.paymentMethod.id) : data.cards.find(c=>c.id===t.paymentMethod.id);
        const amount = t.type === 'Despesa' ? -t.amount : t.amount;
        return [
          t.date, 
          t.description.replace(/,/g, ''), 
          cat?.name || '', 
          source?.name || '', 
          fam?.name || '', 
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

    const getFilteredTransactions = () => {
      return data.transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = !filterCategory || t.categoryId === filterCategory;
        const matchesFam = !filterFamily || t.familyId === filterFamily;
        const matchesDate = (!filterDateStart || t.date >= filterDateStart) && (!filterDateEnd || t.date <= filterDateEnd);
        return matchesSearch && matchesCat && matchesFam && matchesDate;
      }).sort((a,b)=>new Date(b.date) - new Date(a.date));
    };

    const txs = getFilteredTransactions();
    
    return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-white flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><List size={24}/></div>
          Transações
        </h2>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition flex items-center gap-2 border border-zinc-700">
             <Activity size={18}/> Exportar CSV
          </button>
          <button onClick={() => { setEditingItem(null); setModalType('transaction'); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 font-medium">
            <Plus size={18}/> Novo
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg overflow-hidden flex flex-col mb-8">
        <div className="p-4 border-b border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-950/50">
           <div className="relative">
             <Search size={16} className="absolute left-3 top-2.5 text-zinc-500"/>
             <input 
               value={searchTerm}
               onChange={e=>setSearchTerm(e.target.value)}
               placeholder="Burcar descrição..." 
               className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-emerald-500" 
             />
           </div>
           
           <select 
             value={filterCategory} 
             onChange={e=>setFilterCategory(e.target.value)}
             className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
           >
             <option value="">Todas Categorias</option>
             {data.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
           </select>

           <div className="flex gap-2">
             <input type="date" value={filterDateStart} onChange={e=>setFilterDateStart(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
             <input type="date" value={filterDateEnd} onChange={e=>setFilterDateEnd(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
           </div>

           <button onClick={()=>{setSearchTerm(''); setFilterCategory(''); setFilterFamily(''); setFilterDateStart(''); setFilterDateEnd('');}} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition">Limpar Filtros</button>
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
              {txs.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-zinc-500">Nenhuma transação encontrada.</td></tr> : txs.map(t => {
                const cat = data.categories.find(c => c.id === t.categoryId);
                const source = t.paymentMethod.type === 'account' ? data.accounts.find(a=>a.id===t.paymentMethod.id) : data.cards.find(c=>c.id===t.paymentMethod.id);
                return (
                  <tr key={t.id} className="hover:bg-zinc-800/30 transition group">
                    <td className="px-4 py-3 text-zinc-300">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white group-hover:text-emerald-400 transition flex items-center gap-2">
                        {t.description}
                        {t.isPaid === false && <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 uppercase tracking-wider">Provisionado</span>}
                      </div>
                      {t.notes && <div className="text-xs text-zinc-600 mt-1 italic border-l-2 border-zinc-800 pl-2 max-w-xs truncate">{t.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {cat && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300"><span>{cat.icon}</span> {cat.name}</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs flex items-center gap-2">
                      {t.paymentMethod.type === 'card' ? <CreditCard size={14}/> : <Building size={14}/>} {source?.name}
                    </td>
                    <td className={`px-4 py-3 font-mono text-right font-medium ${t.type === 'Receita' ? 'text-emerald-400' : t.type === 'Reserva' ? 'text-blue-400' : 'text-rose-400'}`}>
                      {t.type === 'Despesa' ? '-' : '+'}{formatMoney(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center opacity-0 group-hover:opacity-100 transition">
                      <button onClick={()=>{setEditingItem(t); setModalType('transaction');}} className="p-1 text-zinc-500 hover:text-emerald-400 mx-1"><Edit2 size={16}/></button>
                      <button onClick={()=>{setDeleteContext({id: t.id, collection: 'transactions', title: t.description, groupId: t.groupId}); setModalType('delete');}} className="p-1 text-zinc-500 hover:text-rose-400 mx-1"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans selection:bg-emerald-500/30">
      {/* SIDEBAR */}
      <aside className={`bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} fixed md:relative z-40 h-full bottom-0 md:h-screen ${!isSidebarOpen ? '-translate-x-full md:translate-x-0' : ''}`}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className={`font-bold text-lg text-emerald-400 flex items-center gap-2 ${!isSidebarOpen && 'hidden'}`}>
            <Activity className="text-emerald-500"/>
            ControlFin
          </div>
          {/* Mobile close btn */}
          <button className="md:hidden text-zinc-400" onClick={()=>setSidebarOpen(false)}><X size={20}/></button>
          {!isSidebarOpen && <div className="mx-auto hidden md:block text-emerald-400"><Activity size={24}/></div>}
        </div>
        <div className="flex-1 py-4 flex flex-col gap-1 px-3">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'transactions', icon: List, label: 'Transações' },
            { id: 'accounts', icon: Wallet, label: 'Contas' },
            { id: 'cards', icon: CreditCard, label: 'Cartões' },
            { id: 'categories', icon: Tags, label: 'Categorias' },
            { id: 'family', icon: Users, label: 'Família' },
          ].map(nav => (
            <button key={nav.id} onClick={() => {setActiveTab(nav.id); if(window.innerWidth<768) setSidebarOpen(false);}} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === nav.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'} ${!isSidebarOpen && 'justify-center'}`}>
              <nav.icon size={20} className={activeTab===nav.id ? 'text-emerald-400' : 'text-zinc-500'} />
              {isSidebarOpen && <span>{nav.label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV FIX */}
      <div className="md:hidden fixed bottom-0 w-full bg-zinc-900 border-t border-zinc-800 flex justify-around p-3 z-30 pb-safe">
          {[ 
            { id: 'dashboard', icon: Home },
            { id: 'transactions', icon: List },
            { id: 'accounts', icon: Wallet },
            { id: 'more', icon: Settings, onClick: ()=>setSidebarOpen(true) }
          ].map(nav => (
            <button key={nav.id} onClick={nav.onClick || (()=>setActiveTab(nav.id))} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${activeTab === nav.id ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <nav.icon size={24}/>
            </button>
          ))}
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0 h-screen overflow-y-auto">
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-white capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm">A</div>
          </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto w-full flex-1">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'accounts' && renderAccounts()}
          {activeTab === 'cards' && renderCards()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'family' && renderFamily()}
        </div>
      </main>

      {/* MODALS */}
      {modalType === 'category' && <Modal title={editingItem?'Editar Categoria':'Nova Categoria'} onClose={()=>setModalType(null)}><FormCategory item={editingItem}/></Modal>}
      {modalType === 'account' && <Modal title={editingItem?'Editar Conta':'Nova Conta'} onClose={()=>setModalType(null)}><FormAccount item={editingItem}/></Modal>}
      {modalType === 'card' && <Modal title={editingItem?'Editar Cartão':'Novo Cartão'} onClose={()=>setModalType(null)}><FormCard item={editingItem}/></Modal>}
      {modalType === 'family' && <Modal title={editingItem?'Editar Familiar':'Novo Familiar'} onClose={()=>setModalType(null)}><FormFamily item={editingItem}/></Modal>}
      {modalType === 'transaction' && <Modal title={editingItem?'Editar Transação':'Nova Transação'} onClose={()=>setModalType(null)}><FormTransaction item={editingItem}/></Modal>}
      
      {modalType === 'delete' && (
        <Modal title="Confirmar Exclusão" onClose={()=>setModalType(null)}>
          <div className="p-4 text-center">
            <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
            <p className="text-zinc-300 mb-6">Tem certeza que deseja excluir <strong>{deleteContext?.title}</strong>?<br/><span className="text-zinc-500 text-sm">Esta ação não pode ser desfeita.</span></p>
            <div className="flex gap-4">
              <button onClick={()=>setModalType(null)} className="flex-1 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">Excluir</button>
            </div>
          </div>
        </Modal>
      )}

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div className={`fixed bottom-20 md:bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom font-medium border
          ${feedback === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <Check size={20}/> Operação realizada com sucesso!
        </div>
      )}
    </div>
  );
}
