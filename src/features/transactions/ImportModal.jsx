/**
 * ImportModal - Tela de Importação OFX com Preview e Edição
 * Fluxo: Upload -> Parse -> Preview -> Confirm
 */

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { parseOFX, detectBank, validateOFX } from '../../lib/ofx/parser';
import { calculateTotals } from '../../lib/ofx/mapper';
import { getCategoryConfig } from '../../shared/constants/categoryMap';

export default function ImportModal({ 
  isOpen, 
  onClose, 
  categories = [], 
  wallets = [],
  onImport,

}) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [bank, setBank] = useState(null);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const fileInputRef = useRef(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setSelectedWalletId('');
      setReplaceExisting(false);
      setTransactions([]);
      setBank(null);
      setError(null);
      setImportStats(null);
    }
  }, [isOpen]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    
    try {
      // Read file content
      const content = await file.text();
      
      // Validate OFX format
      const validation = validateOFX(content);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // Detect bank
      const detectedBank = detectBank(content);
      setBank(detectedBank);

      // Parse transactions
      const parsed = await parseOFX(content);
      
      if (parsed.length === 0) {
        setError('Nenhuma transação encontrada no arquivo OFX');
        return;
      }

      // Set transactions and move to preview
      setTransactions(parsed);
      setStep('preview');
      
    } catch (err) {
      setError(`Erro ao processar arquivo: ${err.message}`);
    }
  };

  const handleCategoryChange = (txId, categoryId) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === txId) {
        return { 
          ...tx, 
          category_id: categoryId,
          isValid: (tx.type !== 'Transferência' && categoryId) || (tx.type === 'Transferência' && tx.destination_wallet_id)
        };
      }
      return tx;
    }));
  };

  const handleDestinationWalletChange = (txId, destinationWalletId) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === txId) {
        return { 
          ...tx, 
          destination_wallet_id: destinationWalletId,
          isValid: (tx.type !== 'Transferência' && tx.category_id) || (tx.type === 'Transferência' && destinationWalletId)
        };
      }
      return tx;
    }));
  };

  const handleTypeChange = (txId, newType) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === txId) {
        // Limpar campos não aplicáveis ao novo tipo
        const updatedTx = { ...tx, type: newType };
        if (newType === 'Transferência') {
          updatedTx.category_id = null;
          updatedTx.isValid = Boolean(tx.destination_wallet_id);
        } else {
          updatedTx.destination_wallet_id = null;
          updatedTx.isValid = Boolean(tx.category_id) && Boolean(selectedWalletId);
        }
        return updatedTx;
      }
      return tx;
    }));
  };

  const handleRemoveTransaction = (txId) => {
    setTransactions(prev => prev.filter(tx => tx.id !== txId));
  };

  const handleGlobalWalletChange = (walletId) => {
    setSelectedWalletId(walletId);
    // Update all transactions with new wallet
    setTransactions(prev => prev.map(tx => ({
      ...tx,
      wallet_id: walletId,
      isValid: (tx.type !== 'Transferência' && tx.category_id) || (tx.type === 'Transferência' && tx.destination_wallet_id)
    })));
  };

  const handleConfirmImport = async () => {
    // Validate all transactions (considera transferência também)
    const validTransactions = transactions.filter(tx => 
      selectedWalletId && (
        (tx.type !== 'Transferência' && tx.category_id) ||
        (tx.type === 'Transferência' && tx.destination_wallet_id)
      )
    );

    if (validTransactions.length === 0) {
      setError('Selecione uma categoria (ou carteira de destino para transferências) para todas as transações');
      return;
    }

    setStep('importing');

    try {
      // Prepare transactions for import
      const toImport = validTransactions.map(tx => ({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        // Transferências usam destination_wallet_id, não category_id
        category_id: tx.type === 'Transferência' ? null : tx.category_id,
        wallet_id: selectedWalletId,
        destination_wallet_id: tx.type === 'Transferência' ? tx.destination_wallet_id : null,
        external_id: tx.fitid,
        notes: tx.notes || ''
      }));

      // Call import callback with replace flag
      const stats = await onImport(toImport, { replaceExisting });
      
      setImportStats(stats);
      setStep('done');
      
    } catch (err) {
      setError(`Erro ao importar: ${err.message}`);
      setStep('preview');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const totals = calculateTotals(transactions);

  // Render steps
  const renderUploadStep = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
          <Upload className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          Importar Extrato OFX
        </h3>
        <p className="text-sm text-zinc-400 max-w-xs">
          Selecione um arquivo .OFX ou .QFX do seu banco
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".ofx,.qfx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
      >
        Selecionar Arquivo
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="mt-8 text-xs text-zinc-500">
        <p className="mb-1">Bancos suportados:</p>
        <p>Santander, Bradesco, Itau, Nubank</p>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header com seletor global de wallet */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium text-white">Preview da Importação</h3>
            <p className="text-sm text-zinc-400">
              {transactions.length} transações detectadas
              {bank && <span className="ml-2">• {bank.toUpperCase()}</span>}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Carteira:</span>
            <select
              value={selectedWalletId}
              onChange={(e) => { handleGlobalWalletChange(e.target.value); setReplaceExisting(false); }}
              className="bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-zinc-400">Selecione...</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id} className="bg-zinc-900 text-white">{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Wipe & Replace Checkbox */}
        <div className="mt-3 flex items-start gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-zinc-300">
              Substituir todas as transações existentes nesta carteira
            </span>
          </label>
        </div>

        {/* Warning when checkbox is checked */}
        {replaceExisting && selectedWalletId && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Todas as transações anteriores desta carteira serão excluídas antes da importação.</span>
          </div>
        )}
        {/* Totais */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Receitas:</span>
            <span className="text-emerald-500 font-mono">
              R$ {totals.receita.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Despesas:</span>
            <span className="text-red-500 font-mono">
              R$ {totals.despesa.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Transferências:</span>
            <span className="text-amber-500 font-mono">
              R$ {totals.reserva.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de preview */}
      <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/50 sticky top-0">
            <tr className="text-left text-zinc-400">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium text-right">Valor</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr 
                key={tx.id} 
                className={`border-b border-zinc-800 ${
(tx.type !== 'Transferência' && (!tx.category_id || !selectedWalletId)) || 
                   (tx.type === 'Transferência' && !tx.destination_wallet_id) ? 'bg-red-900/10' : ''
                }`}
              >
                <td className="px-3 py-2 text-zinc-300 font-mono">
                  {tx.date}
                </td>
                <td className="px-3 py-2 text-white max-w-[200px] truncate">
                  {tx.description}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={tx.type}
                    onChange={(e) => handleTypeChange(tx.id, e.target.value)}
                    className={`w-full text-xs rounded-lg px-2 py-1.5 bg-zinc-950/50 border outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer ${
                      tx.type === 'Despesa' ? 'text-red-400 border-zinc-800' :
                      tx.type === 'Receita' ? 'text-emerald-400 border-zinc-800' :
                      'text-amber-400 border-zinc-800'
                    }`}
                  >
                    <option value="Despesa" className="bg-zinc-900 text-white">Despesa</option>
                    <option value="Receita" className="bg-zinc-900 text-white">Receita</option>
                    <option value="Reserva" className="bg-zinc-900 text-white">Reserva</option>
                    <option value="Transferência" className="bg-zinc-900 text-white">Transferência</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-right font-mono text-white">
                  R$ {tx.amount.toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  {tx.type === 'Transferência' ? (
                    <select
                      value={tx.destination_wallet_id || ''}
                      onChange={(e) => handleDestinationWalletChange(tx.id, e.target.value)}
                      className={`w-full text-xs rounded-lg px-2 py-1.5 bg-zinc-950/50 border outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer ${
                        tx.destination_wallet_id ? 'border-zinc-800 text-white' : 'border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <option value="" className="bg-zinc-900 text-zinc-400">Selecionar Destino...</option>
                      {wallets
                        .filter(w => w.id !== selectedWalletId)
                        .map(w => (
                          <option key={w.id} value={w.id} className="bg-zinc-900 text-white">{w.name}</option>
                        ))}
                    </select>
                  ) : (
                    <select
                      value={tx.category_id || ''}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className={`w-full text-xs rounded-lg px-2 py-1.5 bg-zinc-950/50 border outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer ${
                        tx.category_id ? 'border-zinc-800 text-white' : 'border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      <option value="" className="bg-zinc-900 text-zinc-400">Selecionar Categoria...</option>
                      {categories
                        .filter(c => c.type === tx.type || c.type === (tx.type === 'Reserva' ? 'Despesa' : tx.type))
                        .map(c => {
                          const isIdentifier = c.icon && c.icon.length > 2;
                          const emoji = isIdentifier ? getCategoryConfig(c.icon).emoji : (c.icon || '🏷️');
                          return (
                            <option key={c.id} value={c.id} className="bg-zinc-900 text-white">{emoji} {c.name}</option>
                          );
                        })}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleRemoveTransaction(tx.id)}
                    className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer com ações */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep('upload')}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Voltar
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleConfirmImport}
            disabled={!selectedWalletId || transactions.length === 0}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Confirmar Importação
          </button>
        </div>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
      <p className="text-white font-medium">Importando transações...</p>
      <p className="text-sm text-zinc-400 mt-2">
        Isso pode levar alguns segundos
      </p>
    </div>
  );

  const renderDoneStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 mb-4 rounded-full bg-emerald-900/30 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">
        Importação Concluída!
      </h3>
      {importStats && (
        <div className="text-center text-zinc-400 mt-4">
          <p>{importStats.imported} transações importadas</p>
          {importStats.duplicated > 0 && (
            <p className="text-amber-400">{importStats.duplicated} duplicadas ignoradas</p>
          )}
        </div>
      )}
      <button
        onClick={handleClose}
        className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
      >
        Fechar
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-medium text-white">
            ImportarOFX
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
          {step === 'done' && renderDoneStep()}
        </div>
      </div>
    </div>
  );
}
