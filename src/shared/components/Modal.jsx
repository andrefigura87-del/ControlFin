import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
      <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-xl font-medium text-emerald-400">{title}</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
          <X size={20}/>
        </button>
      </div>
      <div className="p-5 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

export default Modal;
