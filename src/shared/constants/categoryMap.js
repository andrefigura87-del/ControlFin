export const CATEGORY_MAP = {
  alimentacao: { emoji: '🍔', color: 'orange' },
  transporte: { emoji: '🚗', color: 'blue' },
  moradia: { emoji: '🏠', color: 'indigo' },
  saude: { emoji: '💊', color: 'emerald' },
  mercado: { emoji: '🛒', color: 'green' },
  educacao: { emoji: '🎓', color: 'purple' },
  lazer: { emoji: '🎮', color: 'pink' },
  vestuario: { emoji: '👕', color: 'cyan' },
  salario: { emoji: '💰', color: 'emerald' },
  investimentos: { emoji: '🏦', color: 'violet' },
  pets: { emoji: '🐶', color: 'amber' },
  viagens: { emoji: '✈️', color: 'sky' },
  default: { emoji: '📌', color: 'zinc' }
};

export const getCategoryConfig = (name) => {
  if (!name) return CATEGORY_MAP.default;
  const normalized = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, '_');
  
  return CATEGORY_MAP[normalized] || CATEGORY_MAP.default;
};
