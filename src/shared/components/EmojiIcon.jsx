import React from 'react';

const COLOR_VARIANTS = {
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  green: 'bg-green-500/10 text-green-400 border-green-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const SIZE_VARIANTS = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-lg',
  lg: 'w-12 h-12 text-2xl',
  xl: 'w-16 h-16 text-4xl'
};

const EmojiIcon = ({ emoji, color = 'zinc', size = 'md', className = '' }) => {
  const isHex = color?.startsWith('#');
  const colorClass = isHex ? '' : (COLOR_VARIANTS[color] || COLOR_VARIANTS.zinc);
  const sizeClass = SIZE_VARIANTS[size] || SIZE_VARIANTS.md;

  const style = isHex ? {
    backgroundColor: `${color}1A`,
    color: color,
    borderColor: `${color}33`
  } : {};

  return (
    <div 
      className={`flex items-center justify-center rounded-xl border font-emoji leading-none select-none shadow-sm ${colorClass} ${sizeClass} ${className}`}
      style={style}
    >
      <span className="translate-y-[1px]">{emoji}</span>
    </div>
  );
};

export default EmojiIcon;
