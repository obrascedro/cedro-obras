# 14. Checklist para novos ambientes

Use ao criar **staging** ou **produção**.

## Fase 1 — Supabase

- [ ] Projeto Supabase criado (região próxima aos usuários)
- [ ] Tabelas core existem: `obras`, `clientes`, `gastos_obra`
- [ ] 11 SQLs executados na ordem ([13-sql-obrigatorios.md](./13-sql-obrigatorios.md))
- [ ] `admin-auth.sql` **não** executado
- [ ] Bucket `notas-fiscais` existe e é privado
- [ ] Signup público **desabilitado** (Auth → Providers → Email)
- [ ] Site URL e Redirect URLs configurados

## Fase 2 — Aplicação

- [ ] Repositório conectado à Vercel
- [ ] Todas env vars configuradas ([11-variaveis-ambiente.md](./11-variaveis-ambiente.md))
- [ ] Deploy concluído sem erro (`npm run build` local passou)
- [ ] Domínio customizado (se aplicável)

## Fase 3 — Usuários iniciais

- [ ] Administrador criado ([16-manual-administradores.md](./16-manual-administradores.md))
- [ ] Funcionários cadastrados ([15-manual-funcionarios.md](./15-manual-funcionarios.md))
- [ ] Vínculos `funcionario_obras` revisados (seed inicial vincula todos — restringir se necessário)
- [ ] Pelo menos uma obra de teste com orçamento

## Fase 4 — Segurança

- [ ] Pentest anon: `node scripts/validation-pre-prod.mjs <url>` — 0 tabelas expostas
- [ ] Rotas protegidas redirecionam para `/login` sem sessão
- [ ] `WHATSAPP_APP_SECRET` configurado (se WhatsApp ativo)
- [ ] Service role key **não** vazou no bundle client

## Fase 5 — Funcional

- [ ] Login admin → dashboard carrega
- [ ] Login funcionário → portal carrega obras autorizadas
- [ ] Envio de nota teste (portal)
- [ ] Aprovação de nota teste (admin)
- [ ] Gasto aparece na obra após aprovação
- [ ] Auditoria registra login e aprovação
- [ ] Funcionário **não** acessa `/admin/auditoria`
- [ ] Funcionário **não** vê nota de outro (URL manual)

## Fase 6 — Integrações (opcional)

- [ ] OpenAI: leitura de nota funciona
- [ ] WhatsApp: webhook verificado (GET challenge)
- [ ] Engenheiro Cedro responde pergunta simples
- [ ] Upstash configurado (produção multi-região)

## Fase 7 — Operações

- [ ] Backup Supabase confirmado ([17-manual-backup.md](./17-manual-backup.md))
- [ ] Contatos de suporte definidos
- [ ] Documentação entregue à equipe

## Critério de go-live

Todos os itens das fases 1–5 **obrigatórios**. Fase 6 conforme escopo. Fase 7 recomendada.
