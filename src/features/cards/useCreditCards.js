import { useMemo } from 'react';
import { useFinance } from '../transactions/useFinance';

/**
 * 💳 useCreditCards
 * Motor de cálculo de faturas em tempo real e gestão de estado dos cartões.
 */
export function useCreditCards() {
  const { data, loading, utils } = useFinance();
  const { transactions, categories } = data;

  const creditCards = useMemo(() => {
    if (!data.cards || data.cards.length === 0) return [];

    return data.cards.map(card => {
      const closingDay = card.closingDay || 10;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();

      // 📅 Determinação do Ciclo de Faturamento Atual
      // O ciclo começa no dia seguinte ao fechamento anterior e termina no dia de fechamento atual.
      let cycleStart, cycleEnd;

      if (currentDay > closingDay) {
        // Ciclo atual fecha no mês seguinte
        cycleStart = new Date(currentYear, currentMonth, closingDay + 1);
        cycleEnd = new Date(currentYear, currentMonth + 1, closingDay);
      } else {
        // Ciclo atual fecha neste mês
        cycleStart = new Date(currentYear, currentMonth - 1, closingDay + 1);
        cycleEnd = new Date(currentYear, currentMonth, closingDay);
      }

      // 🔍 Filtrar transações do cartão dentro do ciclo
      // REGRA: Usar valor INTEGRAL (originalAmount ou amount) ignorando splits familiares
      const cycleTransactions = transactions.filter(t => {
        if (String(t.creditCardId) !== String(card.id)) return false;
        
        const tDate = new Date(t.date + 'T00:00:00');
        return tDate >= cycleStart && tDate <= cycleEnd;
      });

      const currentInvoice = cycleTransactions.reduce((sum, t) => {
        // Priorizar o valor original se disponível (para casos de visualização pessoal vs global)
        // No motor de cartões, a operadora sempre cobra o total.
        return sum + (parseFloat(t.originalAmount || t.amount) || 0);
      }, 0);

      // Cálculo de limite disponível
      // Nota: Para o limite, consideramos todas as transações pendentes/futuras (parcelas) 
      // que ainda não foram pagas na fatura atual ou próximas.
      const totalUsed = transactions
        .filter(t => String(t.creditCardId) === String(card.id) && t.type === 'Despesa')
        .reduce((sum, t) => sum + (parseFloat(t.originalAmount || t.amount) || 0), 0);

      // Pagamentos de fatura reduzem o utilizado
      const totalPaid = transactions
        .filter(t => t.type === 'Pagamento Fatura' && String(t.destinationAccountId) === String(card.id))
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const actualUsed = Math.max(0, totalUsed - totalPaid);

      return {
        ...card,
        currentInvoice,
        actualUsed,
        availableLimit: (card.limit || 0) - actualUsed,
        cycleTransactions,
        billingCycle: {
          start: cycleStart,
          end: cycleEnd
        }
      };
    });
  }, [data.cards, transactions, categories]);

  return {
    creditCards,
    loading,
    utils
  };
}
