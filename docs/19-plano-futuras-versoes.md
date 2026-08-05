# 19. Plano para futuras versões

Roadmap sugerido pós **v1.0**. Priorização sujeita a validação de negócio.

## v1.1 — Estabilização (curto prazo)

| Item | Descrição | Prioridade |
|------|-----------|------------|
| RLS em produção | Garantir SQL hardening aplicado em todos ambientes | P0 |
| Env completo | `WHATSAPP_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | P0 |
| UI `funcionario_obras` | Admin vincula obras sem SQL manual | P1 |
| Auditoria completa | Logs para upload admin, WhatsApp, assistente | P1 |
| Editar perfil funcionário | Troca de senha self-service | P2 |
| Testes E2E | Playwright para login, portal, aprovação | P1 |

## v1.2 — Performance e escala

| Item | Descrição |
|------|-----------|
| Paginação | Notas admin, auditoria, minhas notas |
| Upstash obrigatório | Rate limit distribuído em produção |
| Cache dashboard | Agregações SQL materializadas |
| Engenheiro Cedro | Snapshot incremental, não full scan |
| Lazy loading | Recharts, assistente via `dynamic()` |

## v1.3 — Produto

| Item | Descrição |
|------|-----------|
| Notificações | E-mail/push quando nota aprovada/rejeitada |
| Correção portal | Funcionário reenvia nota após `correcao_solicitada` |
| Relatórios PDF | Export dashboard e gastos por obra |
| Multi-empresa | Tenant isolation (se Cedro crescer para SaaS externo) |
| App mobile PWA | Portal otimizado para câmera offline-first |

## v2.0 — Plataforma

| Item | Descrição |
|------|-----------|
| Migrações Supabase CLI | Substituir SQL manual por migrations versionadas |
| Middleware → Proxy | Next.js 16 convention |
| Role granular | Permissões por módulo (financeiro-only, obras-only) |
| API pública | Webhooks outbound para ERP/contabilidade |
| BI integrado | Metabase ou Supabase Analytics |
| 2FA | TOTP para admins |

## Débitos técnicos conhecidos (v1.0)

- Scripts de teste unitários não cobrem role `diretoria`
- `lib/notas-fiscais-db.ts` e `confirmar-nota-fiscal.ts` — código legado browser
- Middleware deprecated warning (Next.js 16 → proxy)
- Import bulk gastos sem auditoria dedicada
- Funcionário não edita próprio perfil
- 7 warnings ESLint (imports não usados)

## Critérios de release

Para cada versão minor:

1. `npm run build` + lint sem erros
2. Checklist [14-checklist-novos-ambientes.md](./14-checklist-novos-ambientes.md) fases 4–5
3. Pentest anon limpo
4. Changelog documentado
5. Backup testado em staging

## Feedback

Canal sugerido: issues no repositório Git com label `v1.x` / `v2.x`.

---

**Cedro Obras v1.0** — baseline funcional para produção interna com login unificado, portal, admin, dashboard, notas fiscais com IA, auditoria e RLS preparado.
