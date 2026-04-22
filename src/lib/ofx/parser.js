/**
 * OFX Parser - Motor Genérico para extração de transações bancárias
 * Suporta: OFX QFX, QIF, e formatos similares
 */

import { mapToTransaction } from './mapper';

/**
 * Parse OFX content string to transactions
 * @param {string} content - Raw OFX file content
 * @param {object} options - Parser options
 * @returns {Promise<Array>} Array of parsed transactions
 */
export async function parseOFX(content, options = {}) {
  const { bankConfig = null } = options;
  
  // Normalize content - handle different encodings
  const normalizedContent = normalizeOFXContent(content);
  
  // Extract bank transaction list
  const transactions = extractTransactions(normalizedContent);
  
  // Map to internal format
  const mappedTransactions = transactions.map((tx, index) => 
    mapToTransaction(tx, bankConfig, index)
  );
  
  return mappedTransactions;
}

/**
 * Normalize OFX content - handle various encodings and formats
 */
function normalizeOFXContent(content) {
  // Remove BOM if present
  let normalized = content.replace(/^\uFEFF/, '');
  
  // Replace common encoding issues
  normalized = normalized.replace(/&/g, '&amp;');
  
  return normalized;
}

/**
 * Extract transaction blocks from OFX content
 */
function extractTransactions(content) {
  const transactions = [];
  
  // Find STMTTRN blocks (standard OFX)
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  
  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const txBlock = match[1];
    const transaction = extractTransactionFields(txBlock);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  // If no STMTTRN, try TRNTYPE (simpler format)
  if (transactions.length === 0) {
    const trnRegex = /<TRN>([\s\S]*?)<\/TRN>/gi;
    while ((match = trnRegex.exec(content)) !== null) {
      const txBlock = match[1];
      const transaction = extractTransactionFields(txBlock);
      if (transaction) {
        transactions.push(transaction);
      }
    }
  }
  
  return transactions;
}

/**
 * Extract individual fields from a transaction block
 */
function extractTransactionFields(block) {
  const fields = {};
  
  // Common OFX fields
  const fieldMappings = {
    'TRNTYPE': 'type',
    'DTPOSTED': 'datePosted',
    'DTUSER': 'dateUser',
    'TRNAMT': 'amount',
    'FITID': 'fitid',
    'NAME': 'name',
    'MEMO': 'memo',
    'CHECKNUM': 'checkNumber',
    'REFNUM': 'refNumber',
    'SIC': 'sicCode',
    'PAYEEID': 'payeeId',
    'PAYEE NAME': 'payeeName',
    'CCACCTFROM': 'ccAccountFrom',
    'CCACCTTO': 'ccAccountTo'
  };
  
  for (const [fieldName, internalName] of Object.entries(fieldMappings)) {
    const regex = new RegExp(`<${fieldName}>([^<\\n]+)`, 'i');
    const fieldMatch = block.match(regex);
    if (fieldMatch) {
      fields[internalName] = fieldMatch[1].trim();
    }
  }
  
  // Only return if we have essential data
  if (!fields.amount && !fields.datePosted) {
    return null;
  }
  
  return fields;
}

/**
 * Detect bank from OFX content header
 */
export function detectBank(content) {
  const normalized = content.toUpperCase();
  
  // Check for bank-specific identifiers
  if (normalized.includes('SANTANDER') || normalized.includes('BANCO SANTANDER')) {
    return 'santander';
  }
  if (normalized.includes('BRADESCO') || normalized.includes('BANCO BRADESCO')) {
    return 'bradesco';
  }
  if (normalized.includes('ITAU') || normalized.includes('BANCO ITAU') || normalized.includes('ITAÚ')) {
    return 'itau';
  }
  if (normalized.includes('NUBANK') || normalized.includes('NU HOLDINGS')) {
    return 'nubank';
  }
  
  return 'generic';
}

/**
 * Validate OFX content
 */
export function validateOFX(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is empty or invalid' };
  }
  
  const normalized = content.toUpperCase();
  
  // Check for OFX or QFX markers
  if (!normalized.includes('<OFX>') && !normalized.includes('<QFX>') && !normalized.includes('<QIF>')) {
    return { valid: false, error: 'Invalid OFX format - missing OFX/QFX/QIF header' };
  }
  
  return { valid: true };
}

export default {
  parseOFX,
  detectBank,
  validateOFX
};
