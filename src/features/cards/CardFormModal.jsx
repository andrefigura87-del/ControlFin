import React, { useState } from 'react';
import { Button, InputBase } from '../../shared/ui';
import { useFinance } from '../transactions/useFinance';

const BRANDS = [
  { id: 'nubank', label: 'Nubank', color: 'bg-purple-600' },
  { id: 'itau', label: 'Itaú', color: 'bg-orange-500' },
  { id: 'santander', label: 'Santander', color: 'bg-red-600' },
  { id: 'xp', label: 'XP', color: 'bg-zinc-800' },
  { id: 'default', label: 'Outro', color: 'bg-emerald-600' }
];

const CardFormModal = ({ item, onClose }) => {
  const { operations } = useFinance();
  const { saveItem, deleteItem } = operations;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(item || {
    name: '',
    brand: 'default',
    limit: 0,
    closingDay: 10,
    dueDay: 15,
    digits: ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveItem(form, 'cards');
      onClose();
    } catch (err) {
      console.error("Erro ao salvar cartão", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o cartão ${form.name}?`)) {
      setLoading(true);
      try {
        await deleteItem(form.id, 'cards');
        onClose();
      } catch (err) {
        console.error("Erro ao excluir cartão", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Nome do Cartão</label>
        <InputBase 
          autoFocus 
          value={form.name} 
          onChange={e => setForm({ ...form, name: e.target.value })} 
          placeholder="Ex: Nubank Principal"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">Bandeira / Instituição</label>
        <div className="flex gap-2 flex-wrap">
          {BRANDS.map(b => (
            <button
              key={b.id}
              onClick={() => setForm({ ...form, brand: b.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                form.brand === b.id 
                  ? `${b.color} text-white shadow-md scale-105` 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Limite (R$)</label>
          <InputBase 
            type="number" 
            step="0.01" 
            value={form.limit} 
            onChange={e => setForm({ ...form, limit: parseFloat(e.target.value) || 0 })} 
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Últimos 4 Dígitos</label>
          <InputBase 
            maxLength="4" 
            value={form.digits} 
            onChange={e => setForm({ ...form, digits: e.target.value.replace(/\D/g, '') })} 
            placeholder="Ex: 7408"
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Dia de Fechamento</label>
          <InputBase 
            type="number" 
            min="1" 
            max="31" 
            value={form.closingDay} 
            onChange={e => setForm({ ...form, closingDay: parseInt(e.target.value) || 1 })} 
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Dia de Vencimento</label>
          <InputBase 
            type="number" 
            min="1" 
            max="31" 
            value={form.dueDay} 
            onChange={e => setForm({ ...form, dueDay: parseInt(e.target.value) || 1 })} 
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {item?.id && (
          <Button variant="outline" onClick={handleDelete} className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10">
            Excluir
          </Button>
        )}
        <Button variant="solid" onClick={handleSave} disabled={!form.name || loading} className="flex-1">
          {loading ? 'Salvando...' : 'Salvar Cartão'}
        </Button>
      </div>
    </div>
  );
};

export default CardFormModal;
