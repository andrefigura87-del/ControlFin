# ControlFin - Gestão Financeira Inteligente

Sistema de controle financeiro pessoal e familiar, projetado com arquitetura modular (FSD + Clean Architecture) e preparado para infraestrutura Cloud-Native.

## 🏗️ Visão Arquitetural
- **Padrão**: Feature-Sliced Design (FSD) adaptado.
- **Segurança**: Zero Trust Client-Side (AuthContext + ProtectedRoutes).
- **Backend (Atual)**: JSON Server (Mock API).
- **Backend (Futuro)**: Supabase (PostgreSQL + Auth).
- **Frontend**: React 19 + Tailwind CSS 4.0 + Recharts.

## 📊 Estrutura de Dados (`db.json`)
O banco de dados local simula a estrutura relacional necessária para o sistema:

| Coleção | Descrição | Campos Chave |
| :--- | :--- | :--- |
| `categories` | Categorias de fluxo | `id`, `name`, `type` (Receita/Despesa/Reserva), `icon`, `color` |
| `accounts` | Contas Bancárias | `id`, `name`, `type`, `balance`, `color` |
| `cards` | Cartões de Crédito | `id`, `name`, `flag`, `limit`, `closingDay`, `dueDay`, `color` |
| `family` | Membros da Família | `id`, `name`, `relation` |
| `transactions` | Movimentações | `id`, `description`, `amount`, `type`, `date`, `categoryId`, `paymentMethod`, `isPaid`, `groupId` |

## 🚀 Setup do Projeto

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### Instalação
```bash
npm install
```

### Execução em Desenvolvimento
O projeto utiliza `concurrently` para rodar o frontend (Vite) e o mock backend (JSON Server) simultaneamente:

```bash
npm run dev
```
- **Vite (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **JSON Server (API)**: [http://localhost:5000](http://localhost:5000)

## 🛠️ Comandos Disponíveis
- `npm run build`: Gera o bundle de produção para Vercel.
- `npm run lint`: Executa a verificação estática do ESLint.
- `npm run preview`: Visualiza o build localmente.
