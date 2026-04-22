import React from 'react';

/**
 * VolumetricIcon - Componente para ícones com efeito 3D (Claymorphism/Glossy)
 * @param {Object} props
 * @param {React.ElementType} props.icon - Componente Lucide React
 * @param {string} props.color - Chave de cor (primary, secondary, success, danger, warning, info, purple, teal, gold, zinc)
 * @param {string} props.size - Tamanho (sm, md, lg, xl)
 * @param {string} props.className - Classes adicionais para o container
 */
const VolumetricIcon = ({ 
  icon: Icon, 
  color = 'primary', 
  size = 'md',
  className = ''
}) => {
  // Mapeamento de Cores (Gradientes e Sombras)
  const colorVariants = {
    primary: 'from-blue-400 to-blue-600 shadow-blue-500/40 border-blue-300/20',
    secondary: 'from-zinc-400 to-zinc-600 shadow-zinc-500/40 border-zinc-300/20',
    success: 'from-emerald-400 to-emerald-600 shadow-emerald-500/40 border-emerald-300/20',
    danger: 'from-rose-400 to-rose-600 shadow-rose-500/40 border-rose-300/20',
    warning: 'from-amber-400 to-amber-600 shadow-amber-500/40 border-amber-300/20',
    info: 'from-sky-400 to-sky-600 shadow-sky-500/40 border-sky-300/20',
    purple: 'from-violet-400 to-violet-600 shadow-violet-500/40 border-violet-300/20',
    teal: 'from-teal-400 to-teal-600 shadow-teal-500/40 border-teal-300/20',
    gold: 'from-yellow-400 to-yellow-600 shadow-yellow-500/40 border-yellow-300/20',
    zinc: 'from-zinc-500 to-zinc-700 shadow-zinc-500/40 border-zinc-400/20'
  };

  // Mapeamento de Tamanhos
  const sizeVariants = {
    xs: 'w-6 h-6 rounded-lg',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-xl',
    xl: 'w-16 h-16 rounded-2xl'
  };

  // Tamanhos de ícone correspondentes
  const iconSizes = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
  };

  const selectedColor = colorVariants[color] || colorVariants.primary;
  const selectedSize = sizeVariants[size] || sizeVariants.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  return (
    <div className={`
      relative flex items-center justify-center
      bg-gradient-to-br ${selectedColor}
      border-t border-white/10 shadow-lg
      transition-all hover:scale-105 active:scale-95
      ${selectedSize.container}
      ${className}
    `}>
      {/* Glossy Overlay (Reflexo superior) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-[inherit] pointer-events-none" />
      
      {/* Icon */}
      {Icon && (
        <Icon 
          size={iconSize} 
          className="text-white drop-shadow-lg z-10" 
          strokeWidth={2}
        />
      )}

      {/* Volume inferior */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/10 rounded-b-[inherit] pointer-events-none" />
    </div>
  );
};

export default VolumetricIcon;
