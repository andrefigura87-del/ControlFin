/**
 * ControlFin - Seed Script (Node.js)
 * Objetivo: Migrar dados de db.json para o Supabase.
 * 
 * Requisitos:
 * 1. npm install @supabase/supabase-js dotenv
 * 2. .env configurado com SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_USER_ID
 */

require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use a Service Role para ignorar RLS durante o seed
);

const USER_ID = process.env.SUPABASE_USER_ID;

if (!USER_ID) {
  console.error("ERRO: Variável SUPABASE_USER_ID obrigatória no .env!");
  process.exit(1);
}

async function runSeed() {
  console.log("🚀 Iniciando Migração: db.json -> Supabase...");

  const rawData = fs.readFileSync('./db.json', 'utf8');
  const dbContent = JSON.parse(rawData);

  // Maps para converter IDs antigos (JSON) em novos (Supabase UUID)
  const maps = {
    categories: new Map(),
    wallets: new Map(),
    cards: new Map(),
    family_members: new Map()
  };

  try {
    // 1. MIGRAÇÃO DE CATEGORIAS
    console.log("📦 Migrando Categorias...");
    for (const cat of dbContent.categories) {
      const { data, error } = await supabase.from('categories').insert({
        user_id: USER_ID,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color
      }).select();
      if (error) throw error;
      maps.categories.set(cat.id, data[0].id);
    }

    // 2. MIGRAÇÃO DE WALLETS (Accounts)
    console.log("💼 Migrando Wallets...");
    for (const acc of dbContent.accounts) {
      const { data, error } = await supabase.from('wallets').insert({
        user_id: USER_ID,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        color: acc.color
      }).select();
      if (error) throw error;
      maps.wallets.set(acc.id, data[0].id);
    }

    // 3. MIGRAÇÃO DE CARDS
    console.log("💳 Migrando Cartões...");
    for (const card of dbContent.cards) {
      const { data, error } = await supabase.from('cards').insert({
        user_id: USER_ID,
        name: card.name,
        flag: card.flag,
        digits: card.digits,
        limit_amount: card.limit,
        closing_day: card.closingDay,
        due_day: card.dueDay,
        color: card.color
      }).select();
      if (error) throw error;
      maps.cards.set(card.id, data[0].id);
    }

    // 4. MIGRAÇÃO DE FAMILY MEMBERS
    console.log("👥 Migrando Família...");
    for (const member of dbContent.family) {
      const { data, error } = await supabase.from('family_members').insert({
        user_id: USER_ID,
        name: member.name,
        relation: member.relation
      }).select();
      if (error) throw error;
      maps.family_members.set(member.id, data[0].id);
    }

    // 5. MIGRAÇÃO DE TRANSAÇÕES
    console.log("💸 Migrando Transações (Isso pode levar um tempo)...");
    const transactionsToInsert = dbContent.transactions.map(t => ({
      user_id: USER_ID,
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: t.date,
      category_id: maps.categories.get(t.categoryId),
      wallet_id: t.paymentMethod?.type === 'account' ? maps.wallets.get(t.paymentMethod.id) : null,
      card_id: t.paymentMethod?.type === 'card' ? maps.cards.get(t.paymentMethod.id) : null,
      destination_wallet_id: t.destinationAccountId ? maps.wallets.get(t.destinationAccountId) : null,
      family_member_id: maps.family_members.get(t.familyId),
      is_paid: t.isPaid,
      notes: t.notes || '',
      group_id: t.groupId || null
    }));

    // Inserir em chunks de 50 para evitar limites do Supabase/HTTP
    const chunkSize = 50;
    for (let i = 0; i < transactionsToInsert.length; i += chunkSize) {
      const chunk = transactionsToInsert.slice(i, i + chunkSize);
      const { error } = await supabase.from('transactions').insert(chunk);
      if (error) throw error;
    }

    console.log("✅ Migração concluída com sucesso absoluto!");
    console.log(`📊 Total migrado: ${transactionsToInsert.length} transações.`);

  } catch (err) {
    console.error("❌ ERRO NO SEED:", err.message);
    process.exit(1);
  }
}

runSeed();
