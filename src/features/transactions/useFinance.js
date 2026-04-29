import { useState, useMemo, useEffect } from 'react';
import * as api from '../../services/api';
import { useAuth } from '../../core/AuthContext';

export function useFinance() {
  const { user } = useAuth();
  const [data, setData] = useState({
    categories: [],
    accounts: [],
    cards: [],
    family: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('global'); // 'global' | 'personal'

  // Inicialização (HOTFIX: Impedir loop infinito e carregar apenas quando logado)
  useEffect(() => {
    if (!user?.id) return; // Só dispara se houver um usuário autenticado

    const fetchData = async () => {
      setLoading(true);
      try {
        const [categories, accounts, cards, family, transactions] = await Promise.all([
          api.getCategories(),
          api.getAccounts(),
          api.getCards(),
          api.getFamily(),
          api.getTransactions(),
        ]);
        setData({ categories, accounts, cards, family, transactions });
      } catch (err) {
        console.error("Erro ao carregar banco de dados", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]); // Dependência no ID do user para não reagir a mudanças de referência (ex: token refresh no onFocus)

  // HELPERS
  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (iso) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : '';
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  // CÁLCULOS DE MÉTRICAS
  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Enriquecimento com Splits e Filtro de Visão
    const personalMember = data.family.find(m => m.relation === 'Titular' || m.name.toLowerCase().includes('meu'));
    
    let processedTransactions = data.transactions;
    if (viewMode === 'personal' && personalMember) {
      processedTransactions = data.transactions.map(t => {
        const mySplit = t.splits?.find(s => s.memberId === personalMember.id);
        if (mySplit) return { ...t, amount: mySplit.amount };
        return null; // Se não tem split pra mim, não conta na visão pessoal
      }).filter(Boolean);
    }

    // Filtro do Mês Atual
    const monthTransactions = processedTransactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Cálculo de saldo por conta (Enriquecimento)
    const enrichedAccounts = data.accounts.map(a => {
      const txs = processedTransactions.filter(t => t.isPaid !== false);
      
      const credits = txs.filter(t => 
        (t.paymentMethod?.type === 'account' && t.paymentMethod?.id === a.id && t.type === 'Receita') ||
        ((t.type === 'Reserva' || t.type === 'Transferência' || t.type === 'Pagamento Fatura') && t.destinationAccountId === a.id)
      ).reduce((sum, t) => sum + t.amount, 0);

      const debits = txs.filter(t => 
        (t.paymentMethod?.type === 'account' && t.paymentMethod?.id === a.id && (t.type === 'Despesa' || t.type === 'Reserva' || t.type === 'Transferência' || t.type === 'Pagamento Fatura'))
      ).reduce((sum, t) => sum + t.amount, 0);

      return { ...a, currentBalance: (a.balance || 0) + credits - debits };
    });

    const enrichedCards = data.cards.map(c => {
      const cardTransactions = processedTransactions.filter(t => t.paymentMethod?.type === 'card' && t.paymentMethod?.id === c.id && t.type === 'Despesa');
      
      const cardPayments = processedTransactions.filter(t => 
        ((t.type === 'Transferência' || t.type === 'Pagamento Fatura') && t.destinationAccountId === c.id) ||
        (t.type === 'Despesa' && data.categories.find(cat => cat.id === t.categoryId)?.name.toLowerCase().includes('cartão') && !t.destinationAccountId)
      ).reduce((sum, t) => sum + t.amount, 0);

      const totalUsedLimit = cardTransactions
        .filter(t => (t.date <= todayISO || (t.description.includes('(') && t.description.includes('/'))))
        .reduce((sum, t) => sum + t.amount, 0) - cardPayments;

      const historicalAndCurrentExpenses = cardTransactions
        .filter(t => {
          const d = new Date(t.date + 'T12:00:00');
          const cd = c.closingDay || 31; 
          const tMonth = d.getMonth();
          const tYear = d.getFullYear();
          const tDate = d.getDate();
          
          let isFutureCycle = false;
          if (tYear > currentYear) isFutureCycle = true;
          else if (tYear === currentYear && tMonth > currentMonth) isFutureCycle = true;
          else if (tYear === currentYear && tMonth === currentMonth && tDate > cd) isFutureCycle = true;
          
          return !isFutureCycle;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const currentInvoice = Math.max(0, historicalAndCurrentExpenses - cardPayments);
      return { ...c, currentInvoice, totalUsedLimit, availableLimit: (c.limit || 0) - totalUsedLimit };
    });

    const totalBalance = enrichedAccounts.reduce((acc, a) => acc + a.currentBalance, 0);
    const filterRule = (t) => t.isPaid !== false || t.date <= todayISO;
    const isTransfOrPag = (t) => t.type === 'Transferência' || t.type === 'Pagamento Fatura';
    
    const monthReceitas = monthTransactions.filter(t => t.type === 'Receita' && !isTransfOrPag(t) && filterRule(t)).reduce((a, t) => a + t.amount, 0);
    const monthDespesas = monthTransactions.filter(t => t.type === 'Despesa' && !isTransfOrPag(t) && filterRule(t)).reduce((a, t) => a + t.amount, 0);
    const monthReservas = monthTransactions.filter(t => t.type === 'Reserva' && !isTransfOrPag(t) && filterRule(t)).reduce((a, t) => a + t.amount, 0);

    const expensesByCategory = data.categories.filter(c => c.type === 'Despesa').map(c => {
      const total = monthTransactions.filter(t => t.categoryId === c.id && t.type === 'Despesa' && t.date <= todayISO).reduce((a, t) => a + t.amount, 0);
      return { ...c, total };
    }).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

    const maxExpense = expensesByCategory.length ? Math.max(...expensesByCategory.map(c => c.total)) : 1;
    const baseAccountBalance = data.accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const chartData = [];
    let runningReal = baseAccountBalance;
    let runningProjected = baseAccountBalance;

    processedTransactions.filter(t => new Date(t.date + 'T00:00:00') < new Date(currentYear, currentMonth, 1))
      .forEach(t => {
        const val = t.type === 'Receita' ? t.amount : -t.amount;
        if (t.isPaid !== false) runningReal += val;
        runningProjected += val;
      });

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        monthTransactions.filter(t => t.date === dateStr).forEach(t => {
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

    return {
      totalBalance,
      monthReceitas,
      monthDespesas,
      monthReservas,
      expensesByCategory,
      maxExpense,
      todayISO,
      chartData,
      monthTransactions,
      allMonthTransactions: data.transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }),
      enrichedAccounts,
      enrichedCards,
      viewMode
    };
  }, [data, todayISO]);

  // MAPEAMENTO DE MÉTODOS DA API (Prevenção de Reflection Error)
  const apiMap = {
    categories: { create: api.createCategory, update: api.updateCategory, delete: api.deleteCategory },
    accounts: { create: api.createAccount, update: api.updateAccount, delete: api.deleteAccount },
    cards: { create: api.createCard, update: api.updateCard, delete: api.deleteCard },
    family: { create: api.createFamily, update: api.updateFamily, delete: api.deleteFamily },
    transactions: { create: api.createTransaction, update: api.updateTransaction, delete: api.deleteTransaction }
  };

  // OPERAÇÕES DE PERSISTÊNCIA
  const saveItem = async (item, collection) => {
    try {
      let result;
      const methods = apiMap[collection];

      if (item.id) {
        result = await methods.update(item.id, item);
        if (item.splits) {
          await api.updateSplitsForTransaction(item.id, item.splits);
        }
      } else {
        const { id, ...payload } = item;
        result = await methods.create(payload);
        if (item.splits) {
          await api.updateSplitsForTransaction(result.id, item.splits);
        }
      }
      
      // Refresh total data after save to ensure splits are up to date
      await refresh();
      return result;
    } catch (err) {
      console.error("Erro ao salvar item", err);
      throw err;
    }
  };

  const deleteItem = async (id, collection) => {
    try {
      const methods = apiMap[collection];
      await methods.delete(id);
      setData(prev => ({
        ...prev,
        [collection]: prev[collection].filter(i => i.id !== id)
      }));
    } catch (err) {
      console.error("Erro ao excluir item", err);
      throw err;
    }
  };

  // Função para recarregar dados (usada após importação OFX)
  const refresh = async () => {
    setLoading(true);
    try {
      const [categories, accounts, cards, family, transactions] = await Promise.all([
        api.getCategories(),
        api.getAccounts(),
        api.getCards(),
        api.getFamily(),
        api.getTransactions(),
      ]);
      setData({ categories, accounts, cards, family, transactions });
    } catch (err) {
      console.error("Erro ao recarregar dados", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    setData,
    metrics,
    loading,
    utils: { formatMoney, formatDate },
    operations: { 
      saveItem, 
      deleteItem, 
      batchUpdate: api.batchUpdateTransactions, 
      clearAllTransactions: api.deleteAllTransactions,
      setViewMode,
      refresh 
    }
  };
}
