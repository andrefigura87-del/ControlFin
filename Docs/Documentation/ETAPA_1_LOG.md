# ETAPA 1: SERVICE LAYER - LOG DE EXECUÇÃO

Data: 07-04-2026
Status: ✅ Concluído

## Atividades Realizadas

1.  **Mapeamento de Endpoints no Monólito (`App.jsx`)**:
    - Identificadas 5 coleções principais no `json-server`: `categories`, `accounts`, `cards`, `family` e `transactions`.
    - Mapeados métodos CRUD: GET (fetch inicial), POST (criação), PUT (edição/atualização) e DELETE (exclusão).
    - Identificada lógica crítica de `Promise.all` para transações recorrentes e exclusão em lote.

2.  **Criação do Serviço de API (`src/services/api.js`)**:
    - Centralização de todas as chamadas HTTP.
    - Implementação do padrão RESTful com camelCase.
    - Suporte a variáveis de ambiente via `import.meta.env.VITE_API_URL`.
    - Implementação de `batchUpdateTransactions` para resiliência em operações de massa.

3.  **Configuração de Ambiente**:
    - Criação de `.env.example` para documentar as variáveis necessárias.

## Estrutura da Camada de Serviço

-   `src/services/api.js`: Único ponto de contato com o backend.
-   `VITE_API_URL`: Variável para alternar entre ambiente local (`json-server`) e futuro (`Supabase`).

## Pendências de Documentação
- Nenhuma para esta etapa.

## Próximos Passos
- Refatorar o `App.jsx` na Etapa 2 para consumir este novo serviço, reduzindo o acoplamento.
