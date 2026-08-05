# Cedro Obras — Documentação v1.0

Sistema de gestão para construção civil: obras, gastos, notas fiscais, portal do funcionário e painel administrativo.

## Índice

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [Arquitetura](./01-arquitetura.md) | Stack, camadas, integrações |
| 2 | [Estrutura de pastas](./02-estrutura-pastas.md) | Organização do repositório |
| 3 | [Banco de dados](./03-banco-de-dados.md) | Tabelas, colunas, índices |
| 4 | [Relação entre tabelas](./04-relacao-tabelas.md) | Diagrama ER e FKs |
| 5 | [Autenticação](./05-fluxo-autenticacao.md) | Login, sessão, Supabase Auth |
| 6 | [Permissões](./06-fluxo-permissoes.md) | Roles, middleware, RLS |
| 7 | [Portal de Notas](./07-fluxo-portal-notas.md) | Envio e minhas notas |
| 8 | [Fluxo administrativo](./08-fluxo-administrativo.md) | Obras, clientes, gastos, notas |
| 9 | [Dashboard](./09-dashboard.md) | Indicadores e gráficos |
| 10 | [Auditoria](./10-auditoria.md) | Logs e rastreabilidade |
| 11 | [Variáveis de ambiente](./11-variaveis-ambiente.md) | `.env` completo |
| 12 | [Deploy na Vercel](./12-deploy-vercel.md) | Publicação e domínio |
| 13 | [SQLs obrigatórios](./13-sql-obrigatorios.md) | Ordem de execução no Supabase |
| 14 | [Checklist novos ambientes](./14-checklist-novos-ambientes.md) | Staging / produção |
| 15 | [Manual — funcionários](./15-manual-funcionarios.md) | Cadastro e vínculos |
| 16 | [Manual — administradores](./16-manual-administradores.md) | Criação de admins |
| 17 | [Backup](./17-manual-backup.md) | Estratégia de backup |
| 18 | [Recuperação](./18-manual-recuperacao.md) | Restore e contingência |
| 19 | [Roadmap](./19-plano-futuras-versoes.md) | Versões futuras |

## Versão

- **Produto:** Cedro Obras v1.0
- **Stack:** Next.js 16 · React 19 · Supabase · TypeScript
- **Repositório:** `cedro-os`

## Início rápido

```bash
cp .env.example .env.local   # preencher credenciais
npm install
npm run dev                  # http://localhost:3000
```

Consulte o [README principal](../README.md) na raiz do projeto para instalação, execução e manutenção.
