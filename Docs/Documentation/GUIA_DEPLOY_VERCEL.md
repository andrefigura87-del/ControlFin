# GUIA DE DEPLOY - CONTROLFIN V5.5 (VERCEL) 🚀

Para colocar o ControlFin em produção e acessá-lo via Web ou PWA (Mobile), siga os passos abaixo:

## 1. Preparação do Repositório
* Certifique-se de que todos os arquivos (`vite.config.js`, `vercel.json`, `package.json`) foram versionados.
* Realize o **Push** final para a sua branch principal no GitHub.

## 2. Conectando à Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub.
2. Clique em **"Add New"** > **"Project"**.
3. Importe o repositório **"ControleFinanceiro"**.

## 3. Configuração de Variáveis de Ambiente
No painel de configuração da Vercel (antes de clicar em Deploy), expanda a seção **Environment Variables** e adicione:

| Variável | Valor |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Sua URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sua Anon Key do Supabase |

> [!IMPORTANT]
> Certifique-se de que os valores NÃO contenham aspas.

## 4. Deploy e Go-Live
1. Clique em **"Deploy"**.
2. A Vercel detectará automaticamente as configurações do Vite e fará o build.
3. Ao finalizar, você receberá uma URL (ex: `controlefinanceiro.vercel.app`).

---

## 📱 Dica PWA (Android / iOS)
*   **Android**: Abra a URL no Chrome, clique nos 3 pontos e selecione **"Instalar Aplicativo"**.
*   **iOS (Safari)**: Abra a URL, clique no botão de "Compartilhar" e selecione **"Adicionar à Tela de Início"**.

O app aparecerá com o íconeEmerald e fundo Zinc, funcionando como um App Nativo!
