/**
 * categorySuggester.js
 * Motor de Categorização Inteligente para o ControlFin
 * Utiliza heurísticas de Regex e Normalização para sugerir categorias.
 */

/**
 * Normaliza uma string para comparação:
 * 1. Converte para Uppercase.
 * 2. Decompõe caracteres acentuados (NFD).
 * 3. Remove acentos.
 * 4. Remove caracteres especiais (mantém apenas letras, números e espaços).
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toUpperCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^A-Z0-9\s]/g, "") 
    .trim();
};

/**
 * Regras de categorização baseadas em padrões Regex.
 * Ordem importa: as primeiras regras têm prioridade.
 */
const CATEGORY_RULES = [
  // Transporte
  { pattern: /UBER|99APP|CABIFY|POSTO|SHELL|IPIRANGA|PETROBRAS|PEDAGIO|SEM\s?PARAR|VELOE/i, categoryId: 'transporte' },
  
  // Alimentação
  { pattern: /IFOOD|RESTAURANTE|MC\s?DONALDS|BURGER\s?KING|BK|PADARIA|PIZZARIA|CAFE|STARBUCKS|OUTBACK|MADEIRO/i, categoryId: 'alimentacao' },
  
  // Mercado
  { pattern: /MERCADO|CARREFOUR|PAO\s?DE\s?ACUCAR|EXTRA|ASSAI|ATACADAO|HORTIFRUTI|SACOLAO|SUPERMERCADO|ZONA\s?SUL|ST\s?MARCHE/i, categoryId: 'mercado' },
  
  // Assinaturas
  { pattern: /NETFLIX|SPOTIFY|PRIME\s?VIDEO|AMAZON\s?PRIME|DISNEY|HBO|APPLE\.COM|GOOGLE\s?STORAGE|YOUTUBE|CANVA|MICROSOFT/i, categoryId: 'assinaturas' },
  
  // Saúde
  { pattern: /DROGASIL|DROGARAIA|RAIA|FARMACIA|PAGUE\s?MENOS|HOSPITAL|LABORATORIO|CONSULTA|DENTISTA|DROGARIA/i, categoryId: 'saude' },
  
  // Salário / Receitas
  { pattern: /SALARIO|PROVENTO|FOLHA|RENDIMENTO|TRANSFERENCIA\s?RECEBIDA/i, categoryId: 'salario' },
  
  // Investimentos
  { pattern: /CDB|TESOURO|ACOES|FII|CORRETORA|BINANCE|RDB|INVEST/i, categoryId: 'investimentos' },
  
  // Pets
  { pattern: /PETZ|COBASI|VETERINARIO|RACAO|PET\s?SHOP/i, categoryId: 'pets' },
  
  // Academia
  { pattern: /SMARTFIT|BLUEFIT|ACADEMIA|GYMPASS/i, categoryId: 'academia' },
  
  // Moradia
  { pattern: /CONDOMINIO|ALUGUEL|CPFL|ENEL|SABESP|GAS|COMGAS/i, categoryId: 'moradia' }
];

/**
 * Sugere uma categoria com base na descrição da transação.
 * @param {string} description 
 * @returns {string|null} Slug da categoria sugerida ou null
 */
export const suggestCategory = (description) => {
  const normalized = normalizeText(description);
  if (!normalized) return null;

  // Encontra a primeira regra que dá match com a descrição normalizada
  const rule = CATEGORY_RULES.find(r => r.pattern.test(normalized));
  return rule ? rule.categoryId : null;
};
