# ControlFin - Architecture Decision Record (ADR) & Brain Context
**Versão Atual:** v5.5 (Preparação para Cloud-Native)

## 🧠 1. Regras de Negócio Core (NÃO QUEBRAR DURANTE REFATORAÇÃO)
O aplicativo possui lógicas financeiras avançadas que devem ser mantidas em qualquer refatoração de UI/UX:

* **Filtro Temporal Global (`todayISO`):** O sistema utiliza o conceito de "Mês Corrente" rigoroso. Transações futuras não afetam saldos reais.
* **Integridade de Cartão de Crédito:** O cálculo de "Limite Disponível" e "Valor Usado" SÓ contabiliza faturas com `data <= todayISO`. Assinaturas futuras (ex: HBO Max) não devem abater o limite atual.
* **Motor de Recorrências (`groupId`):**
    * Transações parceladas compartilham um UUID em `groupId`.
    * Na criação em lote, APENAS a primeira parcela herda o status do formulário (ex: `isPaid: true`). As demais são injetadas como Provisionadas (`isPaid: false`).
    * Edições ou Exclusões que possuam `groupId` devem acionar um prompt para aplicar a alteração em lote usando `Promise.all()`.
* **Double-Entry (Transferências/Reservas):** * Transações do tipo "Reserva" (ex: aporte no CDB PagBank/Sinking Fund) não possuem Categoria.
    * Na listagem visual, se `type === 'reserva'`, renderizar uma Badge estática de "Transferência".
* **Filtro de Familiares ("Scope Leak" Resolvido):** O cálculo de despesas por membro segue estritamente a regra do Dashboard: `(t.isPaid !== false || t.date <= todayISO)` e apenas do mês selecionado.

## 🏗️ 2. Padrão Arquitetural Alvo
A arquitetura monolítica (`App.jsx` gigante) está sendo refatorada para **Feature-Sliced Design (FSD)**:
* `src/core/`: Provedores e Contextos.
* `src/shared/`: Componentes visuais "Dumbs" (UI pura, agnóstica de banco de dados).
* `src/services/`: Único ponto de contato com a API (`api.js`).
* `src/features/`: Módulos de domínio (`transactions`, `dashboard`, `auth`).

## ☁️ 3. Roadmap de Nuvem (Vercel + Supabase)
* **Zero Trust:** O frontend usará `AuthContext` e `<ProtectedRoute>` para blindagem de rotas.
* **BaaS:** O `json-server` será substituído pelo Supabase (PostgreSQL + RLS).
* **Variáveis:** Utilizar obrigatoriamente `.env` para `VITE_API_URL`.