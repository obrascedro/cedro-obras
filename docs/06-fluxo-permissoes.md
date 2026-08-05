# 6. Fluxo de permissões

## Duas camadas de controle

```mermaid
flowchart LR
  Request[Request HTTP] --> MW[Middleware Next.js]
  MW -->|HTML routes| Page[Página / Action]
  MW -->|Bloqueado| Login[/login]
  Page --> SA[Server Action]
  SA --> AuthCheck[requireAdminSession]
  SA --> Supabase[Supabase Client]
  Supabase --> RLS[RLS PostgreSQL]
```

1. **Middleware** — protege rotas da aplicação Next.js
2. **RLS** — protege dados na REST API do Supabase (defesa primária)

## Matriz de rotas (middleware)

| Rota | admin | diretoria | funcionário | anônimo |
|------|-------|-----------|-------------|---------|
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ | ❌ → portal | ❌ → login |
| `/financeiro/*` | ✅ | ✅ | ❌ → portal | ❌ → login |
| `/obras`, `/clientes` | ✅ | ❌ → dashboard | ❌ → portal | ❌ → login |
| `/admin/*` | ✅ | ❌ → dashboard | ❌ → portal | ❌ → login |
| `/portal/*` | ✅ | ❌ → dashboard | ✅ | ❌ → login |
| `/api/notas-fiscais/*` | — | — | — | 401 sem sessão admin |
| `/api/webhooks/whatsapp` | — | — | — | Meta (HMAC) |

## Matriz RLS (após hardening)

| Tabela | admin | diretoria | funcionário | anon |
|--------|-------|-----------|-------------|------|
| `notas_fiscais` | CRUD | SELECT | SELECT/INSERT próprias | ❌ |
| `obras` | CRUD | SELECT | SELECT vinculadas | ❌ |
| `clientes` | CRUD | SELECT | ❌ | ❌ |
| `gastos_obra` | CRUD | SELECT | ❌ | ❌ |
| `portal_funcionarios` | CRUD | ❌ | ❌ | ❌ |
| `funcionario_obras` | CRUD | ❌ | SELECT próprias | ❌ |
| `profiles` | admin gerencia | SELECT próprio | SELECT próprio | ❌ |
| `audit_logs` | SELECT | ❌ | ❌ | ❌ |
| `assistente_*` | CRUD próprias | ❌ | ❌ | ❌ |
| `classificacoes_aprendidas` | CRUD | ❌ | ❌ | ❌ |

## Server Actions — guards

| Guard | Uso |
|-------|-----|
| `requireAdminSession()` | Obras, clientes, gastos, aprovação, admin |
| `requirePortalSession()` | Envio portal, minhas notas |
| `requireAdminOrDiretoriaSession()` | Disponível para expansão |
| `assertAdminApi()` | Route Handlers `/api/notas-fiscais/*` |

## Service role (bypass RLS)

Usada **apenas no servidor** para:

- Webhook WhatsApp
- Criação de usuários Auth
- Registro de auditoria (fail-safe)
- Jobs internos

Arquivo: `lib/supabase-admin.ts` (`import "server-only"`).

## Isolamento funcionário — notas

```
notas_fiscais.auth_user_id = auth.uid()
  AND origem = 'portal_funcionario'
  AND funcionario_id = meu_funcionario_id()
```

Tentativa de acessar UUID de outro usuário → app retorna 404; RLS bloqueia na API.

## Isolamento funcionário — obras

```
EXISTS (
  SELECT 1 FROM funcionario_obras fo
  WHERE fo.obra_id = obras.id
    AND fo.funcionario_id = meu_funcionario_id()
)
```

Admin gerencia vínculos via SQL (v1.0) ou futura UI.
