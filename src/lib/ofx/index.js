/**
 * OFX Parser Module - Exports
 */

export { parseOFX, detectBank, validateOFX } from './parser';
export { mapToTransaction, validateTransaction, calculateTotals } from './mapper';

// Bank configurations
import santander from './banks/santander.json';
import bradesco from './banks/bradesco.json';
import itau from './banks/itau.json';
import nubank from './banks/nubank.json';

export const bankConfigs = {
  santander,
  bradesco,
  itau,
  nubank
};

export function getBankConfig(bankName) {
  return bankConfigs[bankName.toLowerCase()] || null;
}
