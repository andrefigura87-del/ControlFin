import React, { useState } from 'react';
import { CreditCard as CardIcon, Plus } from 'lucide-react';
import { Card, Button, CreditCardWidget } from '../../shared/ui';
import Modal from '../../shared/components/Modal';
import { useCreditCards } from './useCreditCards';
import CardFormModal from './CardFormModal';

const CardsView = () => {
  const { creditCards, loading } = useCreditCards();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const handleAdd = () => {
    setEditingCard(null);
    setModalOpen(true);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setModalOpen(true);
  };

  if (loading) {
    return <div className="text-zinc-500 p-8 text-center animate-pulse">Carregando cartões...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
          <CardIcon className="text-emerald-500" size={28} />
          Meus Cartões
        </h1>
        <Button variant="solid" onClick={handleAdd} className="flex items-center gap-2">
          <Plus size={18} /> Novo Cartão
        </Button>
      </div>

      {/* Grid de Cartões */}
      {creditCards.length === 0 ? (
        <Card className="text-center py-12 text-zinc-500">
          Nenhum cartão cadastrado. Clique em "Novo Cartão" para começar.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creditCards.map(card => (
            <div key={card.id} onClick={() => handleEdit(card)} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95">
              <CreditCardWidget
                bankId={card.brand}
                bankName={card.name}
                limit={card.limit}
                used={card.currentInvoice}
                lastFour={card.digits || '****'}
                className="h-[200px]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <Modal title={editingCard ? "Editar Cartão" : "Novo Cartão"} onClose={() => setModalOpen(false)}>
          <CardFormModal item={editingCard} onClose={() => setModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default CardsView;
