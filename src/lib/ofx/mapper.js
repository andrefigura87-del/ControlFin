/**
 * OFX Mapper - Mapeia campos OFX para formato interno do ControlFin
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Map OFX transaction to ControlFin internal format
 * @param {object} ofxTx - Raw OFX transaction
 * @param {object} bankConfig - Bank-specific configuration
 * @param {number} index - Transaction index for generating IDs
 * @returns {object} Mapped transaction for preview
 */
export function mapToTransaction(ofxTx, bankConfig = null, index = 0) {
  // Parse amount - handle different formats
  const amount = parseAmount(ofxTx.amount);
  
  // Parse date
  const date = parseDate(ofxTx.datePosted || ofxTx.dateUser);
  
  // Generate unique ID for this draft transaction
  const draftId = uuidv4();
  
  // Infer type from amount sign
  const inferredType = inferType(amount, ofxTx.name, ofxTx.memo);
  
  // Build description from available fields
  const description = buildDescription(ofxTx.name, ofxTx.memo);
  
  return {
    id: draftId,
    // Data fields
    date: date,
    amount: Math.abs(amount),
    description: description,
    type: inferredType,
    // OFX fields for deduplication
    fitid: ofxTx.fitid || generateFitid(date, amount, description, index),
    // Fields user must fill in preview
    category_id: null,       // Required - user selects
    wallet_id: null,        // Required - user selects in global dropdown
    notes: ofxTx.memo || '',
    // Metadata
    isValid: false,         // Will be true when category_id is set
    originalType: ofxTx.type,     // Original OFX type if present
    checkNumber: ofxTx.checkNumber || null
  };
}

/**
 * Parse amount from various OFX formats
 */
function parseAmount(value) {
  if (!value) return 0;
  
  // Convert to string and clean
  let str = String(value).trim();
  
  // Remove currency symbols and spaces
  str = str.replace(/[R$\s]/g, '');
  
  // Handle Brazilian format (1.234,56) vs US format (1234.56)
  // If it has comma as decimal separator and dot as thousands
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse date from OFX format (YYYYMMDD or YYYYMMDDHHMMSS)
 */
function parseDate(dateValue) {
  if (!dateValue) return getTodayDate();
  
  const str = String(dateValue).trim();
  
  // Extract YYYYMMDD part
  const datePart = str.substring(0, 8);
  
  if (!/^\d{8}$/.test(datePart)) {
    return getTodayDate();
  }
  
  const year = parseInt(datePart.substring(0, 4));
  const month = parseInt(datePart.substring(4, 6));
  const day = parseInt(datePart.substring(6, 8));
  
  // Basic validation
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return getTodayDate();
  }
  
  // Return in YYYY-MM-DD format for HTML input
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Infer transaction type based on amount and description
 */
function inferType(amount, name, memo) {
  const fullText = `${name || ''} ${memo || ''}`.toLowerCase();
  
  // Transferências próprias (serviços financeiros brasileiros)
  // Detectamos quando o valor vem por esses serviços (mesmo sendo "despesa" pelo banco)
  const ownAccountKeywords = [
    'nu pagamentos', 'nu pagos', 'nupagamentos',
    'picpay', 'pic pay', 'mercado pago', 'mercadopago',
    'ame digital', 'amez', 'pagseguro', 'pag seguro',
    'paypal', 'caf bank', 'intermedium', 'inter digital',
    'billy', 'zoop', 'stone', 'paggi'
  ];
  
  if (ownAccountKeywords.some(k => fullText.includes(k))) {
    return 'Transferência';
  }
  
  // Credit/deposit indicators
  if (amount > 0) {
    // Check explicit credit indicators
    if (fullText.includes('deposito') || fullText.includes('credito') || 
        fullText.includes('salario') || fullText.includes('recebimento')) {
      return 'Receita';
    }
    return 'Receita';
  }
  
  // Debt/debit indicators - still "Despesa"
  if (fullText.includes('debito') || fullText.includes('pagamento') ||
      fullText.includes('compra') || fullText.includes('tarifa')) {
    return 'Despesa';
  }
  
  // Transfer detection - explicit transfer keywords
  if (fullText.includes('transfer') || fullText.includes('transf') ||
      fullText.includes('pix env') || fullText.includes('envio de pix') ||
      fullText.includes('doc ') || fullText.includes('ted ')) {
    return 'Transferência';
  }
  
  // Default based on sign
  return amount < 0 ? 'Despesa' : 'Receita';
}

/**
 * Higieniza descrição do OFX:
 * - Remove prefixos bancários comuns
 * - Converte UPPERCASE para Title Case
 */
export function sanitizeDescription(text) {
  if (!text) return '';
  
  let str = text.trim();
  
  // 1. Remover prefixos bancários comuns (ordem importa - mais específicos primeiro)
  const prefixes = [
    /^DEBITO\s+VISA\s+ELECTRON\s+/i,
    /^DEBITO\s+MASTERCARD\s+/i,
    /^PIX\s+ENVIADO\s+/i,
    /^PIX\s+RECEBIDO\s+/i,
    /^TED\s+/i,
    /^DOC\s+/i,
    /^COMPRA\s+CARTAO\s+/i,
    /^PAG\*/i,
    /^SAQUE\s+/i,
    /^DEPOSITO\s+/i,
    /^TRANSFERENCIA\s+PIX\s+ENVIADA\s+/i,
    /^TRANSFERENCIA\s+PIX\s+RECEBIDA\s+/i,
    /^BOLETO\s+GERADO\s+/i
  ];
  
  for (const prefix of prefixes) {
    str = str.replace(prefix, '');
  }
  
  // 2. Se ainda está em MAIÚSCULAS (sem minúsculas), converter para Title Case
  // Verifica se não há nenhuma letra minúscula (indicador de texto já formatado)
  if (str === str.toUpperCase() && str.length > 3 && /[A-Z]/.test(str)) {
    str = str.toLowerCase().replace(/(?:^|\s)\S/g, letter => letter.toUpperCase());
  }
  
  // 3. Limpar espaços duplicados
  str = str.replace(/\s{2,}/g, ' ').trim();
  
  return str || 'Transação sem descrição';
}

/**
 * Build description from OFX fields
 */
function buildDescription(name, memo) {
  // Prefer NAME, fallback to MEMO, then generic
  const rawText = (name && name.trim()) || (memo && memo.trim()) || 'Transação sem descrição';
  
  // Higienizar antes de retornar
  return sanitizeDescription(rawText);
}

/**
 * Generate FITID if not provided by bank
 * Retorna null se não houver dados válidos para evitar violação da constraint UNIQUE
 */
function generateFitid(date, amount, description, index) {
  // Se não há date, amount ou description válidos, retornar null
  // Isso permite múltiplas transações com external_id = null (comportamento correto do PostgreSQL)
  if (!date || !amount || amount === 0 || !description) {
    return null;
  }
  
  const datePart = date.replace(/-/g, '');
  const amountPart = String(Math.abs(amount * 100)).replace('.', '').padStart(12, '0');
  const descPart = description.substring(0, 10).replace(/\s/g, '_').replace(/[^A-Z0-9]/g, '0');
  
  // Se após limpeza o ID seria predominantemente zeros, retornar null
  const generatedId = `${datePart}${amountPart}${descPart}_${index}`.toUpperCase();
  const nonZeroCount = (generatedId.match(/[1-9]/g) || []).length;
  
  if (nonZeroCount < 5) {
    return null;  // PostgreSQL UNIQUE permite múltiplos nulls
  }
  
  return generatedId;
}

/**
 * Validate a single transaction has all required fields
 */
export function validateTransaction(tx) {
  const errors = [];
  
  if (!tx.date) {
    errors.push('Data inválida');
  }
  if (!tx.amount || tx.amount <= 0) {
    errors.push('Valor inválido');
  }
  if (!tx.description || tx.description.length < 3) {
    errors.push('Descrição muito curta');
  }
  if (!tx.category_id) {
    errors.push('Categoria não selecionada');
  }
  if (!tx.wallet_id) {
    errors.push('Carterira não selecionada');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Group transactions by type for statistics
 */
export function groupByType(transactions) {
  return {
    Despesa: transactions.filter(t => t.type === 'Despesa'),
    Receita: transactions.filter(t => t.type === 'Receita'),
    Reserva: transactions.filter(t => t.type === 'Reserva')
  };
}

/**
 * Calculate totals by type
 */
export function calculateTotals(transactions) {
  const grouped = groupByType(transactions);
  
  return {
    total: transactions.length,
    despesa: grouped.Despesa.reduce((sum, t) => sum + t.amount, 0),
    receita: grouped.Receita.reduce((sum, t) => sum + t.amount, 0),
    reserva: grouped.Reserva.reduce((sum, t) => sum + t.amount, 0)
  };
}

export default {
  mapToTransaction,
  validateTransaction,
  groupByType,
  calculateTotals,
  sanitizeDescription
};
