/**
 * ControlFin - Cloud Service Layer (api.js)
 * Substituição completa do json-server pelo Supabase SDK.
 * Padrão: Adapter (Conversão camelCase Frontend <-> snake_case Database).
 */

import { supabase } from '../lib/supabase';

// --- HELPERS DE FORMATAÇÃO ---
const formatDate = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
};

// --- ADAPTERS (TRANSFORMAÇÃO DE DADOS) ---

const toCamel = (obj) => {
  if (!obj) return null;
  const mapped = {
    ...obj,
    categoryId: obj.category_id,
    familyId: obj.family_member_id,
    isPaid: obj.is_paid,
    isRecurring: obj.is_recurring,
    groupId: obj.group_id,
    date: formatDate(obj.date),
    destinationAccountId: obj.destination_wallet_id,
    limit: obj.limit_amount,
    closingDay: obj.closing_day,
    dueDay: obj.due_day,
    // Mapeamento especial para paymentMethod esperado pelo hook useFinance
    paymentMethod: obj.card_id 
      ? { type: 'card', id: obj.card_id } 
      : { type: 'account', id: obj.wallet_id }
  };

  // Limpeza de campos snake_case internos do Supabase
  const keysToDelete = [
    'category_id', 'family_member_id', 'wallet_id', 'card_id', 
    'is_paid', 'is_recurring', 'group_id', 'destination_wallet_id', 
    'limit_amount', 'closing_day', 'due_day'
  ];
  keysToDelete.forEach(key => delete mapped[key]);
  
  return mapped;
};

const toSnake = (obj) => {
  if (!obj) return null;
  const { paymentMethod, ...rest } = obj;
  
  const mapped = { ...rest };

  // Mapeamento condicional: Só adiciona a chave snake_case se a camelCase existir
  if (obj.categoryId !== undefined) mapped.category_id = obj.categoryId;
  if (obj.familyId !== undefined) mapped.family_member_id = obj.familyId;
  if (obj.isPaid !== undefined) mapped.is_paid = obj.isPaid;
  if (obj.isRecurring !== undefined) mapped.is_recurring = obj.isRecurring;
  if (obj.groupId !== undefined) mapped.group_id = obj.groupId;
  if (obj.date !== undefined) mapped.date = formatDate(obj.date);
  if (obj.destinationAccountId !== undefined) mapped.destination_wallet_id = obj.destinationAccountId;
  if (obj.limit !== undefined) mapped.limit_amount = obj.limit;
  if (obj.closingDay !== undefined) mapped.closing_day = obj.closingDay;
  if (obj.dueDay !== undefined) mapped.due_day = obj.dueDay;
  
  // Mapeamento de pagamento (Transactions e Cards)
  if (paymentMethod) {
    mapped.wallet_id = paymentMethod.type === 'account' ? paymentMethod.id : null;
    mapped.card_id = paymentMethod.type === 'card' ? paymentMethod.id : null;
  }

  // LIMPEZA: Remove as chaves camelCase originais para não dar erro de coluna inexistente no Supabase
  const camelKeys = [
    'categoryId', 'familyId', 'isPaid', 'isRecurring', 'groupId', 
    'destinationAccountId', 'limit', 'closingDay', 'dueDay', 'paymentMethod'
  ];
  camelKeys.forEach(key => delete mapped[key]);

  // HIGIENIZAÇÃO (Postgres UUID Compatibility): Converte "" em null
  Object.keys(mapped).forEach(key => {
    if (mapped[key] === "") {
      mapped[key] = null;
    }
  });

  return mapped;
};

/** 🧼 SANITIZER: Filtra apenas colunas permitidas (Whitelist) por tabela */
const sanitizePayload = (tableName, data) => {
  const whitelists = {
    categories: ['name', 'icon', 'color', 'type'],
    wallets: ['name', 'balance', 'color'],
    cards: ['name', 'limit_amount', 'closing_day', 'due_day', 'digits', 'color', 'flag'],
    family_members: ['name', 'relation'],
    transactions: [
      'description', 'amount', 'date', 'type', 'is_paid', 'is_recurring', 
      'category_id', 'family_member_id', 'wallet_id', 'card_id', 
      'destination_wallet_id', 'notes'
    ]
  };

  const allowed = whitelists[tableName] || [];
  const sanitized = {};
  
  allowed.forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
};

// --- HELPER DE EXECUÇÃO ---

const execute = async (query) => {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
};

// --- SERVIÇOS POR ENTIDADE ---

/** 🏷️ CATEGORIES */
export const getCategories = () => 
  execute(supabase.from('categories').select('*').is('deleted_at', null))
    .then(rows => rows.map(toCamel));

export const createCategory = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = sanitizePayload('categories', toSnake(data));
  return execute(supabase.from('categories').insert({ ...payload, user_id: user.id }).select())
    .then(rows => toCamel(rows[0]));
};

export const updateCategory = (id, data) => {
  const payload = sanitizePayload('categories', toSnake(data));
  return execute(supabase.from('categories').update(payload).eq('id', id).select())
    .then(rows => toCamel(rows[0]));
};

export const deleteCategory = (id) => 
  execute(supabase.from('categories').update({ deleted_at: new Date() }).eq('id', id));


/** 🏦 ACCOUNTS (Wallets) */
export const getAccounts = () => 
  execute(supabase.from('wallets').select('*').is('deleted_at', null))
    .then(rows => rows.map(toCamel));

export const createAccount = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = sanitizePayload('wallets', toSnake(data));
  return execute(supabase.from('wallets').insert({ ...payload, user_id: user.id }).select())
    .then(rows => toCamel(rows[0]));
};

export const updateAccount = (id, data) => {
  const payload = sanitizePayload('wallets', toSnake(data));
  return execute(supabase.from('wallets').update(payload).eq('id', id).select())
    .then(rows => toCamel(rows[0]));
};

export const deleteAccount = (id) => 
  execute(supabase.from('wallets').update({ deleted_at: new Date() }).eq('id', id));


/** 💳 CARDS */
export const getCards = () => 
  execute(supabase.from('cards').select('*').is('deleted_at', null))
    .then(rows => rows.map(toCamel));

export const createCard = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = sanitizePayload('cards', toSnake(data));
  return execute(supabase.from('cards').insert({ ...payload, user_id: user.id }).select())
    .then(rows => toCamel(rows[0]));
};

export const updateCard = (id, data) => {
  const payload = sanitizePayload('cards', toSnake(data));
  return execute(supabase.from('cards').update(payload).eq('id', id).select())
    .then(rows => toCamel(rows[0]));
};

export const deleteCard = (id) => 
  execute(supabase.from('cards').update({ deleted_at: new Date() }).eq('id', id));


/** 👥 FAMILY */
export const getFamily = () => 
  execute(supabase.from('family_members').select('*').is('deleted_at', null))
    .then(rows => rows.map(toCamel));

export const createFamily = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = sanitizePayload('family_members', toSnake(data));
  return execute(supabase.from('family_members').insert({ ...payload, user_id: user.id }).select())
    .then(rows => toCamel(rows[0]));
};

export const updateFamily = (id, data) => {
  const payload = sanitizePayload('family_members', toSnake(data));
  return execute(supabase.from('family_members').update(payload).eq('id', id).select())
    .then(rows => toCamel(rows[0]));
};

export const deleteFamily = (id) => 
  execute(supabase.from('family_members').update({ deleted_at: new Date() }).eq('id', id));


/** 💸 TRANSACTIONS */
export const getTransactions = () => 
  execute(supabase.from('transactions').select('*').is('deleted_at', null))
    .then(rows => rows.map(toCamel));

export const createTransaction = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = sanitizePayload('transactions', toSnake(data));
  return execute(supabase.from('transactions').insert({ ...payload, user_id: user.id }).select())
    .then(rows => toCamel(rows[0]));
};

export const updateTransaction = (id, data) => {
  const payload = sanitizePayload('transactions', toSnake(data));
  return execute(supabase.from('transactions').update(payload).eq('id', id).select())
    .then(rows => toCamel(rows[0]));
};

export const deleteTransaction = (id) => 
  execute(supabase.from('transactions').update({ deleted_at: new Date() }).eq('id', id));


/** ⚡ BATCH OPERATIONS */
export const batchUpdateTransactions = async (operations) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const promises = operations.map(op => {
    const { id, method, data } = op;
    const body = toSnake(data);

    if (method.toUpperCase() === 'GET') {
      return supabase.from('transactions').select('*').eq('id', id);
    }
    if (method.toUpperCase() === 'DELETE') {
      return supabase.from('transactions').update({ deleted_at: new Date() }).eq('id', id);
    }
    if (method.toUpperCase() === 'PUT') {
      return supabase.from('transactions').update(body).eq('id', id);
    }
    if (method.toUpperCase() === 'POST') {
      return supabase.from('transactions').insert({ ...body, user_id: user.id });
    }
    return Promise.resolve();
  });
  
  const results = await Promise.all(promises);
  results.forEach(r => { if (r.error) throw new Error(r.error.message); });
  return results.map(r => r.data ? toCamel(r.data[0]) : null);
};
