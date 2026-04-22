import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import VolumetricIcon from './VolumetricIcon';

export default function CategoryDropdown({ value, onChange, categories }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Encontra a categoria atualmente selecionada
  const selectedCategory = categories.find(c => c.id === value || c.name === value);

  // Helper de segurança
  const renderIcon = (category) => {
    if (!category || !category.icon) {
      return <VolumetricIcon Icon={AlertTriangle} color="danger" size="sm" />;
    }
    return <VolumetricIcon Icon={category.icon} color={category.color || 'primary'} size="sm" />;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Botão Principal do Select */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 hover:border-gray-600 text-white px-4 py-3 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {selectedCategory ? (
          <div className="flex items-center gap-3">
            {renderIcon(selectedCategory)}
            <span className="font-medium text-gray-200">{selectedCategory.name}</span>
          </div>
        ) : (
          <span className="text-gray-400">Selecione uma categoria...</span>
        )}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Lista Suspensa (Dropdown) */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          <ul className="py-2">
            {categories.map((category) => (
              <li key={category.id || category.name}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(category.id || category.name); // Envia o valor pro formulário
                    setIsOpen(false); // Fecha o dropdown
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                >
                  {renderIcon(category)}
                  <span className="font-medium text-gray-200">{category.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
