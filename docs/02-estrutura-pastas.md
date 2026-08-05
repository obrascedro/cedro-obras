# 2. Estrutura das pastas

```
cedro-os/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions (mutações e auth)
│   │   ├── auth.ts               # login / logout
│   │   ├── admin-funcionarios.ts # CRUD usuários
│   │   ├── admin-auditoria.ts    # consulta logs
│   │   ├── portal-notas.ts       # envio de nota (portal)
│   │   ├── portal-minhas-notas.ts
│   │   ├── notas-fiscais-aprovacao.ts
│   │   ├── notas-fiscais-admin.ts
│   │   ├── obras-admin.ts
│   │   ├── clientes-admin.ts
│   │   ├── gastos-admin.ts
│   │   └── engenheiro-cedro.ts
│   ├── api/                      # Route Handlers
│   │   ├── notas-fiscais/        # leitura IA, aprendizado
│   │   └── webhooks/whatsapp/    # Meta webhook
│   ├── admin/                    # Painel administrativo
│   │   ├── auditoria/
│   │   └── funcionarios/
│   ├── auth/callback/            # OAuth callback Supabase
│   ├── clientes/
│   ├── dashboard/
│   ├── financeiro/
│   │   ├── notas-fiscais/
│   │   └── assistente/           # Engenheiro Cedro
│   ├── login/
│   ├── obras/
│   ├── portal/                   # Portal do funcionário
│   │   ├── notas/
│   │   └── minhas-notas/
│   ├── components/               # Componentes React
│   ├── layout.tsx
│   └── globals.css
├── lib/                          # Lógica de domínio e utilitários
│   ├── auth.ts / auth-constants.ts
│   ├── supabase-server.ts / supabase-admin.ts
│   ├── audit-log.ts / audit-helpers.ts
│   ├── nota-fiscal-*.ts          # IA, classificação, processamento
│   ├── portal-notas/             # Portal específico
│   ├── engenheiro-cedro-*.ts     # Assistente IA
│   └── whatsapp/                 # Integração Meta
├── supabase/                     # Scripts SQL (migrações manuais)
├── scripts/                      # CLI auxiliares (admin, testes)
├── docs/                         # Esta documentação
├── middleware.ts                 # Proteção de rotas
├── next.config.ts
├── .env.example
└── package.json
```

## Convenções

| Padrão | Descrição |
|--------|-----------|
| `app/**/page.tsx` | Server Components (dados no servidor) |
| `app/components/*Client.tsx` | Client Components (`"use client"`) |
| `app/actions/*.ts` | `"use server"` — mutações autenticadas |
| `lib/*.ts` | Funções reutilizáveis, sem JSX |
| `supabase/*.sql` | Migrações idempotentes para SQL Editor |

## Rotas principais

| Rota | Público | Descrição |
|------|---------|-----------|
| `/login` | Sim | Login unificado |
| `/dashboard` | Admin, Diretoria | Painel principal |
| `/obras`, `/clientes` | Admin | CRUD obras e clientes |
| `/financeiro/*` | Admin, Diretoria | Notas fiscais e assistente |
| `/admin/*` | Admin | Funcionários e auditoria |
| `/portal/notas` | Funcionário | Envio de notas |
| `/portal/minhas-notas` | Funcionário | Histórico próprio |
| `/api/webhooks/whatsapp` | Meta (validação) | Webhook externo |
