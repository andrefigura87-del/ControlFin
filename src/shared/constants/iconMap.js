/**
 * ControlFin - Mapeamento de ícones por chave (string)
 * Usado para renderizar ícones a partir de valores salvos no banco
 */
import { 
  UtensilsCrossed,      // 0 - Alimentação
  ShoppingCart,      // 1 - Mercado
  Dumbbell,        // 2 - Academia
  Brain,          // 3 - Saúde mental
  Pill,           // 4 - Farmácia
  Heart,          // 5 - Saúde física
  Home,           // 6 - Moradia
  Car,            // 7 - Transporte
  Plane,          // 8 - Viagem
  GraduationCap,   // 9 - Educação
  Gamepad2,       // 10 - Lazer
  Tv,            // 11 - Streaming
  Smartphone,     // 12 - Telefone
  Zap,           // 13 - Luz
  Droplets,       // 14 - Água
  Wallet,         // 15 - Carteira
  PiggyBank,      // 16 - Poupança
  TrendingUp,     // 17 - Receita
  DollarSign,     // 18 - Renda
  Baby,          // 19 - Filhos
  Gift,          // 20 - Presentes
  Coffee,        // 21 - Cafés
  Cat,           // 22 - Pets
  MoreHorizontal, // 23 - Outros
  CreditCard,    // 24 - Cartão
  HelpCircle,
  AlertTriangle,
  Ban
} from 'lucide-react';

export const ICON_MAP = {
  'utensils': UtensilsCrossed,
  'cart': ShoppingCart,
  'dumbbell': Dumbbell,
  'brain': Brain,
  'pill': Pill,
  'heart': Heart,
  'home': Home,
  'car': Car,
  'plane': Plane,
  'graduation': GraduationCap,
  'gamepad': Gamepad2,
  'tv': Tv,
  'smartphone': Smartphone,
  'zap': Zap,
  'droplets': Droplets,
  'wallet': Wallet,
  'piggy': PiggyBank,
  'trending': TrendingUp,
  'dollar': DollarSign,
  'baby': Baby,
  'gift': Gift,
  'coffee': Coffee,
  'pet': Cat,
  'more': MoreHorizontal,
  'card': CreditCard,
  'help': HelpCircle,
  'warning': AlertTriangle,
  'ban': Ban
};

// Paleta de cores disponíveis
export const COLOR_OPTIONS = [
  { value: 'primary', label: 'Azul', class: 'from-blue-400 to-blue-600' },
  { value: 'success', label: 'Verde', class: 'from-emerald-400 to-emerald-600' },
  { value: 'danger', label: 'Vermelho', class: 'from-rose-400 to-rose-600' },
  { value: 'warning', label: 'Amarelo', class: 'from-amber-400 to-amber-600' },
  { value: 'info', label: 'Ciano', class: 'from-sky-400 to-sky-600' },
  { value: 'purple', label: 'Roxo', class: 'from-violet-400 to-violet-600' },
  { value: 'teal', label: 'Teal', class: 'from-teal-400 to-teal-600' },
  { value: 'gold', label: 'Dourado', class: 'from-yellow-400 to-yellow-600' }
];

// Helper para obter ícone por chave
export const getIconByKey = (key) => {
  return ICON_MAP[key] || ICON_MAP['help'];
};

// Helper para listar opções
export const getIconOptions = () => {
  return Object.entries(ICON_MAP).map(([key, Icon]) => ({ key, Icon }));
};
