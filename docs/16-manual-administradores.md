# 16. Manual — criar novos administradores

## Importante

- Administradores têm **acesso total** ao sistema
- Limite o número de contas admin
- Use senhas fortes e 2FA no e-mail corporativo (recomendado)

## Método 1 — Script CLI (primeiro admin / DevOps)

### Pré-requisitos

- `SUPABASE_SERVICE_ROLE_KEY` no ambiente
- `NEXT_PUBLIC_SUPABASE_URL` configurada

### Executar

```bash
ADMIN_EMAIL="admin@cedroobras.com.br" \
ADMIN_PASSWORD="SuaSenhaForteMin12Chars" \
SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co" \
npm run admin:create-user
```

Ou via `.env.local` preenchido:

```bash
npm run admin:create-user
```

O script:

1. Cria usuário no Supabase Auth (`email_confirm: true`)
2. Define `app_metadata.role = admin`
3. Upsert em `profiles` com `role = admin`, `ativo = true`

**Senha:** mínimo 12 caracteres, sem valor padrão no script.

## Método 2 — Painel Admin (admins subsequentes)

1. Login como admin existente
2. `/admin/funcionarios` → **Criar usuário**
3. Perfil: **Administrador**
4. Preencher nome, e-mail, senha temporária

## Método 3 — SQL manual (emergência)

Após criar usuário em **Supabase → Authentication → Users**:

```sql
UPDATE public.profiles
SET role = 'admin', ativo = true, nome = 'Nome do Admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@empresa.com'
);
```

## Promover funcionário a admin

Via UI: editar usuário em `/admin/funcionarios` → alterar perfil para **Administrador**.

Via SQL:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'uuid-do-usuario';
```

Registrar motivo internamente (auditoria registra alteração de perfil).

## Role diretoria

Para usuários com acesso somente leitura (dashboard/financeiro):

```sql
UPDATE public.profiles SET role = 'diretoria' WHERE id = 'uuid-do-usuario';
```

Diretoria **não** acessa `/admin`, `/obras`, `/clientes`.

## Revogar acesso admin

```sql
UPDATE public.profiles SET ativo = false WHERE id = 'uuid-do-usuario';
```

Ou desativar via UI. Preferível a deletar usuário Auth (preserva auditoria).

## Checklist novo admin

- [ ] Conta criada e testada (login → `/dashboard`)
- [ ] Acesso a `/admin/auditoria` confirmado
- [ ] Senha forte entregue por canal seguro
- [ ] Auditoria registrou criação/alteração
