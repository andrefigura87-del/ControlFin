# Regra de documentação
Você irá criar um agente de IA especializado em arquitetura de software e desenvolvimento de software para documentar o projeto ControlFin.
[REGRAS]
- Toda documentação deve ser feita em Markdown, em PT-BR
- Toda documentação deverá estar em Docs/Documentation
- Eu serei o revisor final de toda documentação, portanto, faça o seu melhor para que eu aprove.
- Você deverá criar um arquivo de log para cada etapa, registrando o que foi feito e o que falta fazer.
- Caso surja alguma dúvida, pergunte-me.
- Não faça alterações no código sem minha permissão.
- Toda alteração no código deverá ter um plano de implementação e eu irei aprovar antes de você fazer a alteração.
- Execute uma etapa, teste a aplicação no navegador (garanta que o npm run dev está rodando sem telas brancas) e faça um git commit antes de enviar o próximo prompt da lista.

# Plano Estratégico de Migração

[ETAPA 1: SERVICE LAYER]
O contexto e regras de negócio do ControlFin estão no `HISTORICO_BRAIN.md`. Nossa primeira meta rumo à arquitetura Cloud-Native é desacoplar os dados.

1. Analise o `App.jsx` atual e mapeie todos os `fetch` para o json-server.
2. Crie e retorne o código completo de `src/services/api.js`.
3. O código deve usar: `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'`;
4. Exporte funções modulares e isoladas: `getTransactions`, `addTransaction`, `updateTransaction`, `deleteTransaction`, e `batchUpdate` (com Promise.all para as recorrências).

Retorne APENAS o código do `api.js` e as instruções para eu criar o arquivo `.env` na raiz. Não altere o `App.jsx` ainda.

[ETAPA 2: REATORAÇÃO FSD]
Com o `api.js` criado, vamos desmembrar o monólito `App.jsx` para a arquitetura Feature-Sliced Design. Vamos fazer isso com segurança.

1. Extraia os componentes visuais puros (sem lógica de API) para `src/shared/components/`. Exemplos: Cards de Banco (com os gradientes do Santander/PagBank), Botões e Inputs.
2. Extraia o Hook de Regras de Negócio: Crie `src/features/transactions/useFinance.js`. Mova para ele o cálculo do `todayISO`, lógicas de limite de cartão e saldo provisionado.
3. Extraia o Dashboard: Mova os gráficos do Recharts e os Cards de Resumo para `src/features/dashboard/DashboardMetrics.jsx`.

Retorne o código do `useFinance.js` e a lista dos arquivos extraídos. Mostre como o `App.jsx` importará a API gerada na etapa anterior.

[ETAPA 3: DATA MIGRATION E SUPABASE]
A arquitetura FSD está validada localmente. Vamos iniciar a migração do banco de dados (Lift and Shift) para o Supabase.

1. Script DDL (Supabase): Gere o código `supabase_schema.sql` para criar as tabelas `transactions`, `categories`, `family_members`, e `wallets`. 
   - Use `wallet_id` para suportar o Double-Entry.
   - Adicione políticas de Row Level Security (RLS) usando `(user_id = auth.uid())` para arquitetura Zero Trust.
   - Inclua `deleted_at` para Soft Delete.
2. Script de Seed (Backup): Crie o código completo de um utilitário `seed.js` em Node.js. Ele deve ler o meu `db.json` local e usar o `@supabase/supabase-js` para fazer um INSERT massivo no novo banco, preservando os `groupId` de recorrências.

[ETAPA 4: AUTH GUARD E INTEGRAÇÃO CLOUD]
Os dados já estão no Supabase. O passo final é a segurança e a conexão do Frontend com a Nuvem.

1. Crie o `src/core/AuthContext.jsx` para gerenciar a sessão do usuário com o SDK do Supabase.
2. Crie o componente `<ProtectedRoute>` que redireciona para a tela de `/login` caso o token não exista (Zero Trust).
3. Refatore o nosso `src/services/api.js` (criado na Etapa 1). Substitua os comandos `fetch` nativos pelos comandos do SDK `@supabase/supabase-js`, mantendo as mesmas assinaturas de função para não quebrar os componentes do React.
4. Forneça o checklist de Variáveis de Ambiente necessárias para o Deploy na Vercel.