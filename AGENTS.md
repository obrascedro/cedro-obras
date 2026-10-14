<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
Crie uma página inicial de dashboard para o Cedro OS na rota "/".

Use os dados da tabela "obras" do Supabase.

O dashboard deve mostrar:

- Total de obras cadastradas
- Total de orçamento previsto
- Total de valor recebido
- Total de gasto realizado
- Total de lucro estimado
- Quantidade de obras por status

Também mostrar uma tabela com as 5 obras mais recentes contendo:

- Nome da obra
- Cliente
- Status
- Orçamento
- Recebido
- Gasto
- Lucro
- Data de início

Requisitos:

- Utilizar o cliente existente em lib/supabase.ts
- Buscar os dados diretamente do Supabase
- Somar os valores no código
- Formatar valores em Real brasileiro
- Visual moderno, profissional e responsivo
- Manter o mesmo estilo visual atual do Cedro OS
- Adicionar navegação no topo para:
  - Dashboard
  - Clientes
  - Obras
- Não alterar as páginas já existentes
- Exibir mensagem de erro caso a consulta ao Supabase falhe

Depois de concluir, informe quais arquivos foram criados ou alterados.

## Cursor Cloud specific instructions

- Install with `npm ci` (Node.js 20+; Node 22 on the default image is fine). The lockfile is `package-lock.json`.
- Dev server: `npm run dev:lan` (listens on `0.0.0.0:3000`). Production check: `npm run build`.
- Every route returns 500 until `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set. Middleware creates the Supabase client on each request and throws when they are missing. `SUPABASE_SERVICE_ROLE_KEY` is required for admin clients and CLI scripts. `OPENAI_API_KEY` is required only for leitura de notas and Engenheiro Cedro.
- There is no local database. Auth and data come from the hosted Supabase project. `.env*` is gitignored, so do not commit env files.
- Checks that do not need the network: `npm run lint` (existing warnings, zero errors), `npx tsc --noEmit`, `npm run test:whatsapp`, `node scripts/test-auth-routing.mjs`, `node scripts/test-minhas-notas.mjs`, `npm run test:auditoria`.
