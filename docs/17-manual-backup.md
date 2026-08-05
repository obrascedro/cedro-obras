# 17. Manual de backup

## O que precisa ser protegido

| Ativo | Onde | Criticidade |
|-------|------|-------------|
| Banco PostgreSQL | Supabase | **Crítica** |
| Arquivos de notas | Supabase Storage (`notas-fiscais`) | **Crítica** |
| Usuários Auth | Supabase Auth | Alta |
| Código | Git (GitHub) | Alta |
| Secrets | Vercel + Supabase Dashboard | Alta |

## Backup Supabase (recomendado)

### Plano Pro ou superior

- **Daily backups** automáticos (retention conforme plano)
- **Point-in-Time Recovery (PITR)** — restore para qualquer segundo nos últimos 7 dias (Pro)

Configurar em: Supabase Dashboard → **Settings → Database → Backups**

### Plano Free

- Sem backup automático gerenciado
- **Export manual** obrigatório antes de mudanças críticas

## Export manual do banco

### Via Supabase Dashboard

1. **Database → Backups** (se disponível) ou
2. **SQL Editor** → exportar dados críticos:

```sql
-- Exemplo: exportar contagem por tabela (sanity check)
SELECT 'notas_fiscais' AS t, count(*) FROM notas_fiscais
UNION ALL SELECT 'gastos_obra', count(*) FROM gastos_obra
UNION ALL SELECT 'obras', count(*) FROM obras;
```

### Via `pg_dump` (local)

Com connection string do Supabase (Settings → Database):

```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  -f cedro-backup-$(date +%Y%m%d).sql
```

## Backup Storage (notas fiscais)

1. Supabase Dashboard → **Storage → notas-fiscais**
2. Ou script com service role listando e baixando objetos
3. Frequência recomendada: **semanal** ou antes de migrações SQL

## Backup de configuração

Exportar e versionar (sem secrets):

- Lista de env vars (nomes, não valores) — `.env.example`
- Scripts SQL aplicados — pasta `supabase/`
- Documentação — pasta `docs/`

## Frequência recomendada

| Ambiente | Banco | Storage | Código |
|----------|-------|---------|--------|
| Produção | Diário (PITR) | Semanal | A cada deploy (Git) |
| Staging | Antes de testes SQL | Mensal | Git |
| Dev | Opcional | — | Git |

## Retenção

- Backups SQL manuais: 90 dias mínimo
- Logs auditoria: 12 meses (política interna)
- Notas fiscais (legal): conforme obrigação fiscal — tipicamente 5 anos

## Teste de backup

**Mensalmente** (produção):

1. Restaurar backup em projeto Supabase **staging**
2. Validar login e contagem de registros
3. Abrir uma nota fiscal e verificar arquivo no Storage

Backup não testado = backup inexistente.
