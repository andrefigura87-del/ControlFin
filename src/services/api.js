/**
 * ControlFin - Service Layer (api.js)
 * Centralização de todas as chamadas HTTP para desacoplar o frontend do backend.
 * 
 * PADRÃO: 
 * - get[Entity]
 * - create[Entity] 
 * - update[Entity]
 * - delete[Entity]
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Erro na API: ${response.status}`);
  }
  return response.json();
};

/** 📊 CATEGORIES */
export const getCategories = () => fetch(`${API_URL}/categories`).then(handleResponse);

export const createCategory = (data) => fetch(`${API_URL}/categories`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const updateCategory = (id, data) => fetch(`${API_URL}/categories/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const deleteCategory = (id) => fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }).then(handleResponse);


/** 💳 ACCOUNTS */
export const getAccounts = () => fetch(`${API_URL}/accounts`).then(handleResponse);

export const createAccount = (data) => fetch(`${API_URL}/accounts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const updateAccount = (id, data) => fetch(`${API_URL}/accounts/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const deleteAccount = (id) => fetch(`${API_URL}/accounts/${id}`, { method: 'DELETE' }).then(handleResponse);


/** 💳 CARDS */
export const getCards = () => fetch(`${API_URL}/cards`).then(handleResponse);

export const createCard = (data) => fetch(`${API_URL}/cards`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const updateCard = (id, data) => fetch(`${API_URL}/cards/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const deleteCard = (id) => fetch(`${API_URL}/cards/${id}`, { method: 'DELETE' }).then(handleResponse);


/** 👥 FAMILY */
export const getFamily = () => fetch(`${API_URL}/family`).then(handleResponse);

export const createFamily = (data) => fetch(`${API_URL}/family`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const updateFamily = (id, data) => fetch(`${API_URL}/family/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const deleteFamily = (id) => fetch(`${API_URL}/family/${id}`, { method: 'DELETE' }).then(handleResponse);


/** 💸 TRANSACTIONS */
export const getTransactions = () => fetch(`${API_URL}/transactions`).then(handleResponse);

export const createTransaction = (data) => fetch(`${API_URL}/transactions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const updateTransaction = (id, data) => fetch(`${API_URL}/transactions/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(handleResponse);

export const deleteTransaction = (id) => fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' }).then(handleResponse);

/**
 * ⚡ BATCH OPERATIONS
 * Ideal para operações de massa em recorrências (Promise.all)
 */
export const batchUpdateTransactions = async (operations) => {
  const requests = operations.map(op => {
    const { id, method, data } = op;
    const url = id ? `${API_URL}/transactions/${id}` : `${API_URL}/transactions`;
    
    return fetch(url, {
      method: method.toUpperCase(), // 'POST', 'PUT' ou 'DELETE'
      headers: method.toUpperCase() !== 'DELETE' ? { 'Content-Type': 'application/json' } : {},
      body: method.toUpperCase() !== 'DELETE' ? JSON.stringify(data) : undefined
    }).then(handleResponse);
  });
  
  return Promise.all(requests);
};
