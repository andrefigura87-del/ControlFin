import React from 'react';
import { Plus } from 'lucide-react';

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

export default ListHeader;
