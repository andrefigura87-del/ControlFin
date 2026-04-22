/**
 * ControlFin - Mapeamento de ícones e cores para categorias padrão
 * Usado pelo VolumetricIcon
 */

import { 
  UtensilsCrossed,      // Alimentação
  Dumbbell,          // Academia
  Brain,            // Saúde mental
  ShoppingCart,      // Mercado
  Pill,             // Farmácia
  TrendingUp,        // Salário/Receita
  Wallet,           // Carteira
  CreditCard,       // Cartão
  Home,            // Moradia
  Car,             // Transporte
  Plane,           // Viagem
  GraduationCap,    // Educação
  Gamepad2,         // Lazer
  Tv,              // Streaming
  Smartphone,      // Telefone/Internet
  Zap,             // Luz
  Droplets,         // Água
  Heart,           // Saúde
  Baby,            // Filhos
  Gift,            // Presentes
  Coffee,          // Cafés
  Cat,             // Pets
  MoreHorizontal   // Outros
} from 'lucide-react';

// Paleta de cores para VolumetricIcon
export const CATEGORY_COLORS = {
  danger: 'danger',     // Vermelho (alertas, despesas)
  success: 'success',   // Verde (receitas)
  warning: 'warning',  // Amarelo
  teal: 'teal',       // Teal (saúde)
  purple: 'purple',   // Roxo (lazer)
  gold: 'gold',       // Dourado (compras)
  info: 'info',       // Ciano
  primary: 'primary', // Azul (fixos)
  secondary: 'secondary' // Cinza
};

// Mapeamento de categorias padrão
export const DEFAULT_CATEGORIES = {
  // DESPESAS
 alimentacao: { icon: UtensilsCrossed, color: 'warning', name: 'Alimentação', type: 'Despesa' },
  academia: { icon: Dumbbell, color: 'teal', name: 'Academia', type: 'Despesa' },
  saude: { icon: Brain, color: 'purple', name: 'Saúde', type: 'Despesa' },
  mercado: { icon: ShoppingCart, color: 'gold', name: 'Mercado', type: 'Despesa' },
  farmacia: { icon: Pill, color: 'success', name: 'Farmácia', type: 'Despesa' },
  moradia: { icon: Home, color: 'primary', name: 'Moradia', type: 'Despesa' },
  transporte: { icon: Car, color: 'warning', name: 'Transporte', type: 'Despesa' },
  viagem: { icon: Plane, color: 'info', name: 'Viagem', type: 'Despesa' },
  educacao: { icon: GraduationCap, color: 'purple', name: 'Educação', type: 'Despesa' },
  lazer: { icon: Gamepad2, color: 'purple', name: 'Lazer', type: 'Despesa' },
  streaming: { icon: Tv, color: 'danger', name: 'Streaming', type: 'Despesa' },
  telefone: { icon: Smartphone, color: 'info', name: 'Telefone/Internet', type: 'Despesa' },
  luz: { icon: Zap, color: 'warning', name: 'Luz', type: 'Despesa' },
  agua: { icon: Droplets, color: 'info', name: 'Água', type: 'Despesa' },
  saude_fisica: { icon: Heart, color: 'teal', name: 'Saúde', type: 'Despesa' },
  filhos: { icon: Baby, color: 'purple', name: 'Filhos', type: 'Despesa' },
  presentes: { icon: Gift, color: 'warning', name: 'Presentes', type: 'Despesa' },
  cafe: { icon: Coffee, color: 'warning', name: 'Cafés', type: 'Despesa' },
  pets: { icon: Cat, color: 'gold', name: 'Pets', type: 'Despesa' },
  
  // RECEITAS
  salario: { icon: TrendingUp, color: 'success', name: 'Salário', type: 'Receita' },
  renda_extra: { icon: TrendingUp, color: 'success', name: 'Renda Extra', type: 'Receita' },
  
  // RESERVAS/TRANSFERÊNCIAS
  transferencia: { icon: Wallet, color: 'info', name: 'Transferência', type: 'Reserva' },
  cartao: { icon: CreditCard, color: 'danger', name: 'Cartão', type: 'Despesa' },
  
  // OUTROS
  outros: { icon: MoreHorizontal, color: 'secondary', name: 'Outros', type: 'Despesa' }
};

// Procurar categoria por nome
export const getCategoryByName = (name) => {
  if (!name) return DEFAULT_CATEGORIES.outros;
  
  const key = Object.keys(DEFAULT_CATEGORIES).find(k => 
    DEFAULT_CATEGORIES[k].name.toLowerCase() === name.toLowerCase() ||
    k.toLowerCase() === name.toLowerCase().replace(/\s+/g, '_')
  );
  
  return DEFAULT_CATEGORIES[key] || DEFAULT_CATEGORIES.outros;
};

// Procurar categoria por ícone (compatibilidade reversa)
export const getCategoryConfig = (iconName) => {
  const key = Object.keys(DEFAULT_CATEGORIES).find(k => k === iconName);
  return DEFAULT_CATEGORIES[key] || DEFAULT_CATEGORIES.outros;
};

export default {
  DEFAULT_CATEGORIES,
  CATEGORY_COLORS,
  getCategoryByName,
  getCategoryConfig
};
