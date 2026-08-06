# 13. SQLs obrigatórios

Execute no **SQL Editor** do Supabase Dashboard, **um arquivo por vez**, aguardando sucesso.

## Ordem de execução

```
 1. supabase/unified-auth.sql
 2. supabase/notas-fiscais.sql
 3. supabase/portal-funcionarios.sql
 4. supabase/notas-fiscais-aprovacao.sql
 5. supabase/classificacoes-aprendidas.sql
 6. supabase/assistente-conversas.sql
 7. supabase/portal-minhas-notas-rls.sql
 8. supabase/admin-funcionarios.sql
 9. supabase/audit-logs.sql
10. supabase/funcionario-obras.sql
11. supabase/production-rls-hardening.sql   ← SEMPRE POR ÚLTIMO
```

## Pré-requisito

Tabelas **`obras`**, **`clientes`** e **`gastos_obra`** devem existir no banco (schema core da Cedro).

## Não executar

| Arquivo | Motivo |
|---------|--------|
| `supabase/admin-auth.sql` | Deprecated — conflita com `unified-auth.sql` |
| `supabase/notas-fiscais-update.sql` | Redundante — policy UPDATE inclusa no hardening |

## Resumo por arquivo

| # | Arquivo | O que faz |
|---|---------|-----------|
| 1 | unified-auth.sql | Tabela `profiles`, trigger signup, roles |
| 2 | notas-fiscais.sql | Tabela notas, bucket storage (policies temporárias) |
| 3 | portal-funcionarios.sql | Cadastro funcionários, coluna `funcionario_id` |
| 4 | notas-fiscais-aprovacao.sql | Colunas aprovação, eventos, status |
| 5 | classificacoes-aprendidas.sql | IA aprendizada |
| 6 | assistente-conversas.sql | Engenheiro Cedro |
| 7 | portal-minhas-notas-rls.sql | `auth_user_id`, RLS por dono |
| 8 | admin-funcionarios.sql | Email em profiles, RLS admin |
| 9 | audit-logs.sql | Auditoria + triggers |
| 10 | funcionario-obras.sql | Vínculo funcionário↔obra + seed |
| 11 | production-rls-hardening.sql | RLS produção, diretoria, ownership assistente |

## Pós-portal (se envio de notas pelo funcionário falhar no status)

Após `portal-minhas-notas-rls.sql`, se o portal retornar erro ao mudar status para `processando`:

```
supabase/notas-fiscais-update-funcionario-rls.sql
```

## Verificação pós-SQL

```bash
node scripts/validation-pre-prod.mjs https://sua-url.vercel.app
```

Todas as tabelas na seção **RLS (anon REST API)** devem retornar **OK** (0 linhas expossas).

Query manual no SQL Editor:

```sql
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Deve listar policies sem role `anon` em tabelas sensíveis.

## Ambiente existente (atualização)

Se scripts 1–9 já foram aplicados anteriormente, execute apenas:

```
10. supabase/funcionario-obras.sql
11. supabase/production-rls-hardening.sql
```

Scripts são **idempotentes** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
