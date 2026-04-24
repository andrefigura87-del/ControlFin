import React, { useState } from 'react';
import { Settings, Trash2, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { useFinance } from '../transactions/useFinance';

export default function SettingsView() {
  const { operations } = useFinance();
  const { clearAllTransactions, refresh } = operations;
  const [isConfirming, setIsConfirming] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleClearTransactions = async () => {
    setStatus('loading');
    try {
      await clearAllTransactions();
      await refresh();
      setStatus('success');
      setIsConfirming(false);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Settings className="text-emerald-400 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Configurações</h2>
          <p className="text-zinc-400 text-sm">Gerencie seus dados e preferências do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Gestão de Dados */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <RefreshCcw className="text-amber-400 w-5 h-5" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Gestão de Dados</h3>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Utilize estas ferramentas para resetar ou limpar informações do seu banco de dados.
          </p>

          <div className="space-y-4">
            {!isConfirming ? (
              <button
                onClick={() => setIsConfirming(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/5 transition-all group/btn"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="text-zinc-500 group-hover/btn:text-red-400 w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-zinc-300 group-hover/btn:text-red-400">Limpar Transações</p>
                    <p className="text-xs text-zinc-500">Apaga todo o histórico de lançamentos</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 animate-in zoom-in-95">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-red-400 w-5 h-5" />
                  <p className="text-sm font-semibold text-red-400">Tem certeza absoluta?</p>
                </div>
                <p className="text-xs text-red-300/70 mb-4 leading-relaxed">
                  Esta ação irá EXCLUIR PERMANENTEMENTE todas as suas transações do banco de dados. Esta operação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearTransactions}
                    disabled={status === 'loading'}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? 'Limpando...' : 'Sim, Limpar Tudo'}
                  </button>
                  <button
                    onClick={() => setIsConfirming(false)}
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-4 h-4" />
                Histórico limpo com sucesso!
              </div>
            )}
          </div>
        </div>

        {/* Card Informativo / Futuro */}
        <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center opacity-50">
          <Settings className="text-zinc-600 w-10 h-10 mb-4" />
          <h3 className="text-zinc-400 font-medium">Mais Opções em Breve</h3>
          <p className="text-zinc-600 text-xs mt-2">Exportação PDF, Temas Customizados e Backup</p>
        </div>
      </div>
    </div>
  );
}
