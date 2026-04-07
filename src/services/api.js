/**
 * ControlFin - Adapter Service Layer (api.js)
 * Final Stage: Substituindo json-server pelo SDK do Supabase.
 * Padrão: Adapter (Mapeia camelCase <-> snake_case).
 */

import { supabase } from '../lib/supabase';

// HELPERS DE TRANSFORMAÇÃO (Padrão Adapter)
const toCamel = (obj) => {
  if (!obj) return null;
  const mapped = {
    ...obj,
    categoryId: obj.category_id,
    familyId: obj.family_member_id,
    paymentMethod: obj.card_id ? { type: 'card', id: obj.card_id } : { type: 'account', id: obj.wallet_id },
    isPaid: obj.is_paid,
    groupId: obj.group_id,
    destinationAccountId: obj.destination_wallet_id,
    limit: obj.limit_amount,
    closingDay: obj.closing_day,
    dueDay: obj.due_day
  };
  // Deletar as chaves snake_case originais para limpar o objeto do frontend
  delete mapped.category_id;
  delete mapped.family_member_id;
  delete mapped.wallet_id;
  delete mapped.card_id;
  delete mapped.is_paid;
  delete mapped.group_id;
  delete mapped.destination_wallet_id;
  delete mapped.limit_amount;
  delete mapped.closing_day;
  delete mapped.due_day;
  return mapped;
};

const toSnake = (obj) => {
  if (!obj) return null;
  const { paymentMethod, ...rest } = obj;
  return {
    ...rest,
    category_id: obj.categoryId,
    family_member_id: obj.familyId,
    wallet_id: paymentMethod?.type === 'account' ? paymentMethod.id : null,
    card_id: paymentMethod?.type === 'card' ? paymentMethod.id : null,
    is_paid: obj.isPaid,
    group_id: obj.groupId,
    destination_wallet_id: obj.destinationAccountId,
    limit_amount: obj.limit,
    closing_day: obj.closingDay,
    due_day: obj.dueDay
  };
};

// HANDLER PADRÃO PARA ERROS
const handleSupabaseError = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

/** 📊 CATEGORIES */
export const getCategories = () => supabase.from('categories').select('*').is('deleted_at', null).then(handleSupabaseError).then(rows => rows.map(toCamel));
export const createCategory = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('categories').insert({ ...toSnake(data), user_id: user.id }).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
};
export const updateCategory = (id, data) => supabase.from('categories').update(toSnake(data)).eq('id', id).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
export const deleteCategory = (id) => supabase.from('categories').update({ deleted_at: new Date() }).eq('id', id).then(handleSupabaseError);


/** 💼 WALLETS (Accounts na UI) */
export const getAccounts = () => supabase.from('wallets').select('*').is('deleted_at', null).then(handleSupabaseError).then(rows => rows.map(toCamel));
export const createAccount = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('wallets').insert({ ...toSnake(data), user_id: user.id }).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
};
export const updateAccount = (id, data) => supabase.from('wallets').update(toSnake(data)).eq('id', id).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
export const deleteAccount = (id) => supabase.from('wallets').update({ deleted_at: new Date() }).eq('id', id).then(handleSupabaseError);


/** 💳 CARDS */
export const getCards = () => supabase.from('cards').select('*').is('deleted_at', null).then(handleSupabaseError).then(rows => rows.map(toCamel));
export const createCard = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('cards').insert({ ...toSnake(data), user_id: user.id }).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
};
export const updateCard = (id, data) => supabase.from('cards').update(toSnake(data)).eq('id', id).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
export const deleteCard = (id) => supabase.from('cards').update({ deleted_at: new Date() }).eq('id', id).then(handleSupabaseError);


/** 👥 FAMILY */
export const getFamily = () => supabase.from('family_members').select('*').is('deleted_at', null).then(handleSupabaseError).then(rows => rows.map(toCamel));
export const createFamily = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('family_members').insert({ ...toSnake(data), user_id: user.id }).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
};
export const updateFamily = (id, data) => supabase.from('family_members').update(toSnake(data)).eq('id', id).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
export const deleteFamily = (id) => supabase.from('family_members').update({ deleted_at: new Date() }).eq('id', id).then(handleSupabaseError);


/** 💸 TRANSACTIONS */
export const getTransactions = () => supabase.from('transactions').select('*').is('deleted_at', null).then(handleSupabaseError).then(rows => rows.map(toCamel));

export const createTransaction = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from('transactions').insert({ ...toSnake(data), user_id: user.id }).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));
};

export const updateTransaction = (id, data) => supabase.from('transactions').update(toSnake(data)).eq('id', id).select().then(handleSupabaseError).then(rows => toCamel(rows[0]));

export const deleteTransaction = (id) => supabase.from('transactions').update({ deleted_at: new Date() }).eq('id', id).then(handleSupabaseError);


/**
 * ⚡ BATCH OPERATIONS
 */
export const batchUpdateTransactions = async (operations) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const promises = operations.map(op => {
    const { id, method, data } = op;
    if (method.toUpperCase() === 'DELETE') {
      return supabase.from('transactions').update({ deleted_at: new Date() }).eq('id', id);
    }
    if (method.toUpperCase() === 'PUT') {
      return supabase.from('transactions').update(toSnake(data)).eq('id', id);
    }
    if (method.toUpperCase() === 'POST') {
      return supabase.from('transactions').insert({ ...toSnake(data), user_id: user.id });
    }
    return Promise.resolve();
  });
  
  return Promise.all(promises).then(results => {
    results.forEach(r => { if (r.error) throw r.error; });
    return results.map(r => r.data ? r.data[0] : null);
  });
};
