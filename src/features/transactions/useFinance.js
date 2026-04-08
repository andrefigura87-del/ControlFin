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

  // Inicialização (HOTFIX: Impedir loop infinito e carregar apenas quando logado)
  useEffect(() => {
    if (!user) return; // Só dispara se houver um usuário autenticado

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
  }, [user?.id]); // Dependência no ID do usuário para reagir a login/logout

  // HELPERS
  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  // CÁLCULOS DE MÉTRICAS
  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filtro do Mês Atual
    const monthTransactions = data.transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Cálculo de saldo por conta (Enriquecimento)
    const enrichedAccounts = data.accounts.map(a => {
      const txs = data.transactions.filter(t => t.isPaid !== false);
      
      // Entradas: Receitas na conta OU Reservas destinadas a esta conta
      const credits = txs.filter(t => 
        (t.paymentMethod?.type === 'account' && t.paymentMethod?.id === a.id && t.type === 'Receita') ||
        (t.type === 'Reserva' && t.destinationAccountId === a.id)
      ).reduce((sum, t) => sum + t.amount, 0);

      // Saídas: Despesas na conta OU Reservas saindo desta conta
      const debits = txs.filter(t => 
        (t.paymentMethod?.type === 'account' && t.paymentMethod?.id === a.id && (t.type === 'Despesa' || t.type === 'Reserva'))
      ).reduce((sum, t) => sum + t.amount, 0);

      return { ...a, currentBalance: (a.balance || 0) + credits - debits };
    });

    // Cálculo de gastos e limite de cartões (Enriquecimento)
    const enrichedCards = data.cards.map(c => {
      const used = data.transactions
        .filter(t => t.paymentMethod?.type === 'card' && t.paymentMethod?.id === c.id && t.type === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...c, used, availableLimit: (c.limit || 0) - used };
    });

    const totalBalance = enrichedAccounts.reduce((acc, a) => acc + a.currentBalance, 0);

    // Métricas do Mês (Considerando Efetivado OU <= Hoje)
    const filterRule = (t) => t.isPaid !== false || t.date <= todayISO;
    
    const monthReceitas = monthTransactions.filter(t => t.type === 'Receita' && filterRule(t)).reduce((a, t) => a + t.amount, 0);
    const monthDespesas = monthTransactions.filter(t => t.type === 'Despesa' && filterRule(t)).reduce((a, t) => a + t.amount, 0);
    const monthReservas = monthTransactions.filter(t => t.type === 'Reserva' && filterRule(t)).reduce((a, t) => a + t.amount, 0);

    // Despesas por Categoria
    const expensesByCategory = data.categories.filter(c => c.type === 'Despesa').map(c => {
      const total = monthTransactions.filter(t => t.categoryId === c.id && t.type === 'Despesa' && t.date <= todayISO).reduce((a, t) => a + t.amount, 0);
      return { ...c, total };
    }).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

    const maxExpense = expensesByCategory.length ? Math.max(...expensesByCategory.map(c => c.total)) : 1;

    // RECHARTS DATA PREP
    const baseAccountBalance = data.accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const chartData = [];
    let runningReal = baseAccountBalance;
    let runningProjected = baseAccountBalance;

    // Ajuste inicial por transações passadas
    data.transactions.filter(t => new Date(t.date + 'T00:00:00') < new Date(currentYear, currentMonth, 1))
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
      enrichedAccounts,
      enrichedCards
    };
  }, [data, todayISO]);

  // OPERAÇÕES DE PERSISTÊNCIA
  const saveItem = async (item, collection) => {
    try {
      let result;
      if (item.id) {
        result = await api[`update${collection.charAt(0).toUpperCase() + collection.slice(1, -1)}`](item.id, item);
      } else {
        const { id, ...payload } = item;
        result = await api[`create${collection.charAt(0).toUpperCase() + collection.slice(1, -1)}`](payload);
      }
      
      setData(prev => {
        const list = prev[collection];
        const isUpdate = list.some(i => i.id === result.id);
        return {
          ...prev,
          [collection]: isUpdate ? list.map(i => i.id === result.id ? result : i) : [result, ...list]
        };
      });
      return result;
    } catch (err) {
      console.error("Erro ao salvar item", err);
      throw err;
    }
  };

  const deleteItem = async (id, collection) => {
    try {
      await api[`delete${collection.charAt(0).toUpperCase() + collection.slice(1, -1)}`](id);
      setData(prev => ({
        ...prev,
        [collection]: prev[collection].filter(i => i.id !== id)
      }));
    } catch (err) {
      console.error("Erro ao excluir item", err);
      throw err;
    }
  };

  return {
    data,
    setData,
    metrics,
    loading,
    utils: { formatMoney, formatDate },
    operations: { saveItem, deleteItem, batchUpdate: api.batchUpdateTransactions }
  };
}
