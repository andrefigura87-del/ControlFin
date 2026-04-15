# ControlFin - Gestão Financeira Inteligente (v6.1.1)

Sistema de controle financeiro pessoal e familiar desenhado com o padrão **Feature-Sliced Design (FSD)**, rodando 100% em infraestrutura **Cloud-Native**.

## 🏗️ Visão Arquitetural
- **Padrão**: Feature-Sliced Design (FSD) Adaptado (Core, Features, Services, Shared).
- **Segurança**: Arquitetura Zero Trust Client-Side baseada em Context API e Supabase Auth (`AuthContext` + `ProtectedRoutes`).
- **Backend (BaaS)**: **Supabase** (PostgreSQL + Auth + Row Level Security).
- **Frontend**: **React 19** + **Vite 8** + **Tailwind CSS 4.0** + PWA Habilitado.

## 🚀 Funcionalidades Chave (Release v6)
- **Gestão de Cartões de Crédito Avançada**: Compatibilidade com ciclo de fatura real (Fechamento/Vencimento) e conciliação de pagamentos usando transferências neutras.
- **Motor de Injeção Múltipla**: Geração automática de Lançamentos Parcelados e Inteligência Recorrente.
- **Rateio Familiar**: Gestão de gastos centralizada dividida e assinalada para membros da família.
- **Filtros e Gráficos**: Sistema de filtros unificados em interface dark modernizada (Fontes, Status, Categoria, Transações) interligados a um Dashboard de consumo projetado.
- **Proteção Adaptable**: Segurança nativa da API por rotinas de sanitização rigorosa via **Payload Whitelists**.

## 📊 Estrutura de Banco de Dados (`PostgreSQL / Supabase`)
O backend conta com uma lógica completamente normalizada:
- `categories`: `id, name, type, icon, color`
- `wallets` (Contas Bancárias): `id, name, type, balance, color`
- `cards` (Cartões): `id, name, flag, limit_amount, digits, closing_day, due_day, color`
- `family_members`: `id, name, relation`
- `transactions`: Tabela massiva de histórico financeiro relacional usando `destination_wallet_id` para fluxos transferência entre contas e pagamento de faturas.

## 💻 Instalação Local

### Pré-requisitos
- Node.js (v18+)
- Conta no Supabase (com chaves URL e ANON KEY no `.env.local`)

### Rodando o Projeto
```bash
npm install
npm run dev
```
Acesse localmente através de [http://localhost:5173](http://localhost:5173).

## 🛠️ Comandos Disponíveis
- `npm run dev`: Ambiente de desenvolvimento Vite + HMR.
- `npm run build`: Gera o bundle otimizado PWA.
- `npm run lint`: Checagem sintática padrão.
