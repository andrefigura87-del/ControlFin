export function exportTransactionsToCSV(transactions, categories, accounts, cards) {
  const headers = ['Data', 'Descricao', 'Categoria', 'Fonte', 'Tipo', 'Valor'];
  
  const rows = transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId);
    const paymentMethod = t.paymentMethod;
    
    let sourceName = '';
    if (paymentMethod?.type === 'account') {
      const account = accounts.find(a => a.id === paymentMethod.id);
      sourceName = account?.name || '';
    } else if (paymentMethod?.type === 'card') {
      const card = cards.find(c => c.id === paymentMethod.id);
      sourceName = card?.name || '';
    }
    
    let amount;
    if (t.type === 'Despesa' || t.type === 'Reserva' || 
        (t.type === 'Transferência' && t.paymentMethod?.id === paymentMethod?.id) ||
        (t.type === 'Pagamento Fatura')) {
      amount = -t.amount;
    } else {
      amount = t.amount;
    }
    
    const row = [
      t.date,
      t.description.replace(/,/g, ''),
      category?.name || '',
      sourceName,
      t.type,
      amount.toFixed(2).replace('.', '')
    ];
    
    return row.join(',');
  });
  
  const csv = [headers.join(','), ...rows].join('\n');
  
  return csv;
}

export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}