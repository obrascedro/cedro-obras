# 18. Manual de recuperação

## Cenários e procedimentos

### 1. Aplicação fora do ar (Vercel)

**Sintomas:** 502/503, deploy failed

1. Vercel Dashboard → Deployments → verificar último deploy
2. **Rollback** para deployment anterior estável
3. Verificar env vars não foram alteradas
4. `npm run build` local para reproduzir erro

### 2. Banco corrompido ou dados apagados

**Sintomas:** tabelas vazias, erros em massa

1. **Parar** deploys e mutações (modo manutenção — comunicar usuários)
2. Supabase → **Database → Backups → Restore** (PITR se Pro)
3. Ou restaurar dump manual em projeto staging primeiro
4. Validar contagens e integridade FK
5. Reaplicar SQLs se schema desatualizado ([13-sql-obrigatorios.md](./13-sql-obrigatorios.md))

### 3. RLS quebrado (dados expostos ou inacessíveis)

**Sintomas:** anon key expõe dados OU app retorna vazio para admin

1. **Não** panique — middleware ainda protege rotas HTML
2. Reexecutar `production-rls-hardening.sql`
3. Validar: `node scripts/validation-pre-prod.mjs <url>`
4. Revisar `pg_policies` no SQL Editor

### 4. Storage inacessível

**Sintomas:** notas não abrem, upload falha

1. Verificar bucket `notas-fiscais` existe
2. Reexecutar seção Storage de `production-rls-hardening.sql`
3. Verificar policies em `storage.objects`

### 5. Login não funciona

**Sintomas:** todos os usuários bloqueados

1. Supabase → Auth → verificar provider Email ativo
2. Verificar Site URL / Redirect URLs
3. Conferir `profiles.ativo = true` para admins
4. Reset senha via Supabase Dashboard ou script admin

### 6. Conta admin perdida

```bash
ADMIN_EMAIL="recuperacao@empresa.com" \
ADMIN_PASSWORD="NovaSenhaForte123" \
npm run admin:create-user
```

Ou criar usuário no Supabase Auth + SQL promote (ver [16-manual-administradores.md](./16-manual-administradores.md)).

### 7. Vazamento de service role key

1. Supabase → Settings → API → **Rotate** service role key
2. Atualizar Vercel env vars imediatamente
3. Redeploy
4. Revisar logs de acesso suspeitos
5. Considerar rotacionar anon key também

### 8. OpenAI / WhatsApp indisponível

- **OpenAI down:** notas ficam em status erro; reprocessar manualmente depois
- **WhatsApp down:** portal web continua funcionando; fila Meta retenta webhook

## Ordem de prioridade na recuperação

```
1. Restaurar autenticação (admin consegue logar)
2. Restaurar RLS (dados protegidos)
3. Restaurar funcionalidade portal (funcionários enviam notas)
4. Restaurar integrações (IA, WhatsApp)
5. Validar auditoria e backups
```

## Contatos de escalação

| Responsável | Área |
|-------------|------|
| DevOps / Dev | Vercel, deploy, código |
| DBA / Admin Supabase | Banco, RLS, backup |
| Product (Edson) | Comunicação usuários, priorização |

Preencher com contatos reais da Cedro Obras antes do go-live.

## Comunicação em incidente

1. Notificar equipe interna
2. Estimar tempo de recuperação
3. Se > 1h, avisar funcionários de campo (canal alternativo para notas)
4. Post-mortem documentado em 48h

## Validação pós-recuperação

Executar checklist completo: [14-checklist-novos-ambientes.md](./14-checklist-novos-ambientes.md) fases 4–5.
