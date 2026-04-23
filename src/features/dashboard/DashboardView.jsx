import React from 'react';
import { useFinance } from '../transactions/useFinance';
import { Card, Button, InputBase, SummaryCard, CreditCardWidget, TransactionTable } from '../../shared/ui';

const DashboardView = () => {
  const { metrics, utils, data } = useFinance();
  const { formatMoney } = utils;
  const { totalBalance, monthReceitas, monthDespesas, enrichedCards, monthTransactions } = metrics;

  // Transform transactions to match the UI component signature
  const recentTransactions = monthTransactions
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type === 'Receita' ? 'income' : 'expense',
      category: data.categories.find(c => c.id === t.categoryId)?.name || 'Outros'
    }));

  return (
    <div className="space-y-8">
      {/* 1. Header do Dashboard */}
      <div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up-fade" 
        style={{ animationFillMode: 'backwards', animationDelay: '0ms' }}
      >
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Visão Geral</h1>
          <p className="text-gray-400 mt-1">Bem-vindo de volta! Acompanhe suas finanças.</p>
        </div>
        <Button variant="solid">Importar OFX</Button>
      </div>

      {/* 2. Top Grid (Resumo Financeiro) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Saldo Atual" 
          value={formatMoney(totalBalance || 0)} 
          trend="neutral" 
          className="animate-slide-up-fade"
          style={{ animationFillMode: 'backwards', animationDelay: '100ms' }}
        />
        <SummaryCard 
          title="Receitas" 
          value={formatMoney(monthReceitas || 0)} 
          trend="positive" 
          className="animate-slide-up-fade"
          style={{ animationFillMode: 'backwards', animationDelay: '200ms' }}
        />
        <SummaryCard 
          title="Despesas" 
          value={formatMoney(monthDespesas || 0)} 
          trend="negative" 
          className="animate-slide-up-fade"
          style={{ animationFillMode: 'backwards', animationDelay: '300ms' }}
        />
      </div>

      {/* 3. Middle Section (Cartões e Ações) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          className="lg:col-span-2 animate-slide-up-fade" 
          style={{ animationFillMode: 'backwards', animationDelay: '400ms' }}
        >
          <Card className="min-h-[220px] h-full flex items-center justify-center text-gray-500 border-dashed">
            Gráfico de Fluxo de Caixa em Breve
          </Card>
        </div>
        <div 
          className="lg:col-span-1 flex flex-col gap-4 animate-slide-up-fade" 
          style={{ animationFillMode: 'backwards', animationDelay: '500ms' }}
        >
          {enrichedCards?.length > 0 ? (
            enrichedCards.map(c => (
              <CreditCardWidget 
                key={c.id}
                bankId={c.bank || 'default'} 
                bankName={c.name} 
                limit={c.limit || 0} 
                used={c.currentInvoice || 0} 
                lastFour={c.lastFour || '****'} 
              />
            ))
          ) : (
            <Card className="min-h-[220px] h-full flex items-center justify-center text-gray-500 border-dashed">
              Nenhum cartão
            </Card>
          )}
        </div>
      </div>

      {/* 4. Bottom Section (Últimas Transações) */}
      <div 
        className="mt-8 animate-slide-up-fade" 
        style={{ animationFillMode: 'backwards', animationDelay: '600ms' }}
      >
        <h2 className="text-xl font-semibold text-white mb-6">Últimas Transações</h2>
        <TransactionTable transactions={recentTransactions} />
      </div>
    </div>
  );
};

export default DashboardView;
