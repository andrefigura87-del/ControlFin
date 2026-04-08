# ControlFin - Gestão Financeira Inteligente (v5.6)

Sistema de controle financeiro pessoal e familiar, agora em sua versão **Cloud-Native**. O projeto utiliza as tecnologias mais modernas para garantir performance, segurança e portabilidade.

## 🏗️ Stack Tecnológica
- **Frontend**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Backend (BaaS)**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)
- **Visualização**: [Recharts](https://recharts.org/)
- **Mobile**: Suporte nativo a **PWA** (Progressive Web App) para iOS/Android.

## 🚀 Arquitetura (FSD)
O projeto segue o padrão **Feature-Sliced Design (FSD)**, garantindo modularidade e manutenibilidade:
- `src/core/`: Provedores e contextos globais (`AuthContext`).
- `src/features/`: Módulos de domínio (`transactions`, `dashboard`).
- `src/services/`: Camada de comunicação com a API (Supabase SDK).
- `src/shared/`: Componentes visuais atômicos e utilitários.

## 🛠️ Configuração e Setup

### 1. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e configure as seguintes chaves do seu projeto Supabase:

```env
VITE_SUPABASE_URL=SUA_URL_DO_SUPABASE
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_DO_SUPABASE
```

### 2. Instalação
```bash
npm install
```

### 3. Execução em Desenvolvimento
```bash
npm run dev
```

## 📦 Deploy (Vercel)
O projeto está configurado via `vercel.json` para suportar rotas SPA e o build otimizado do Vite. basta conectar seu repositório GitHub à Vercel e configurar as variáveis de ambiente acima no painel da Vercel.

## 📱 Instalação PWA
Para instalar no celular:
1. Abra o navegador (Safari no iOS / Chrome no Android).
2. Acesse a URL do deploy.
3. Clique em "Compartilhar" -> "Adicionar à Tela de Início".
