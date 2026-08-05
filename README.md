# Cedro Obras

**Gestão inteligente para construção civil** — obras, gastos, notas fiscais, portal do funcionário e painel administrativo.

| | |
|---|---|
| **Versão** | 1.0 |
| **Stack** | Next.js 16 · React 19 · Supabase · TypeScript · Tailwind CSS |
| **Documentação** | [docs/README.md](./docs/README.md) |

---

## Funcionalidades

- **Login unificado** — admin, funcionário e diretoria em `/login`
- **Dashboard** — indicadores financeiros e alertas por obra
- **Obras e clientes** — cadastro, gastos, importação em lote
- **Notas fiscais** — upload, leitura IA, aprovação, lançamento automático de gastos
- **Portal de Notas** — funcionários enviam fotos/PDFs pelo celular
- **Engenheiro Cedro** — assistente IA com dados das obras
- **Auditoria** — trilha de ações sensíveis
- **WhatsApp** — recebimento opcional de notas via Meta Cloud API

---

## Instalação

### Pré-requisitos

- Node.js 20+
- Conta [Supabase](https://supabase.com) com projeto criado
- Tabelas core no banco: `obras`, `clientes`, `gastos_obra`

### Passos

```bash
git clone <url-do-repositorio> cedro-os
cd cedro-os
npm install
cp .env.example .env.local
```

Preencha `.env.local` conforme [docs/11-variaveis-ambiente.md](./docs/11-variaveis-ambiente.md).

### Banco de dados

Execute os SQLs no Supabase **na ordem documentada**:

→ [docs/13-sql-obrigatorios.md](./docs/13-sql-obrigatorios.md)

### Primeiro administrador

```bash
ADMIN_PASSWORD="SuaSenhaForteMin12Chars" npm run admin:create-user
```

Detalhes: [docs/16-manual-administradores.md](./docs/16-manual-administradores.md)

---

## Executar

### Desenvolvimento

```bash
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

Rede local (celular na mesma Wi-Fi):

```bash
npm run dev:lan
```

### Produção local

```bash
npm run build
npm run start
```

### Qualidade

```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript
npm run build         # Build de produção
```

### Testes

```bash
npm run test:whatsapp
node scripts/test-auth-routing.mjs
node scripts/test-minhas-notas.mjs
npm run test:auditoria
node scripts/validation-pre-prod.mjs http://localhost:3000
```

---

## Deploy

Hospedagem recomendada: **[Vercel](https://vercel.com)**

Guia completo: [docs/12-deploy-vercel.md](./docs/12-deploy-vercel.md)

Resumo:

1. Conectar repositório Git à Vercel
2. Configurar variáveis de ambiente (Production)
3. Ajustar Site URL no Supabase Auth
4. Executar [checklist de go-live](./docs/14-checklist-novos-ambientes.md)

---

## Manutenção

### Atualizar o sistema

```bash
git pull origin main
npm install
npm run build
# redeploy automático na Vercel via Git push
```

Após atualizações que incluam novos SQLs, executar scripts pendentes no Supabase ([docs/13-sql-obrigatorios.md](./docs/13-sql-obrigatorios.md)).

### Adicionar funcionário

[docs/15-manual-funcionarios.md](./docs/15-manual-funcionarios.md)

### Adicionar administrador

[docs/16-manual-administradores.md](./docs/16-manual-administradores.md)

### Backup e recuperação

- [docs/17-manual-backup.md](./docs/17-manual-backup.md)
- [docs/18-manual-recuperacao.md](./docs/18-manual-recuperacao.md)

### Novo ambiente (staging/produção)

[docs/14-checklist-novos-ambientes.md](./docs/14-checklist-novos-ambientes.md)

---

## Estrutura do projeto

```
app/          → páginas, componentes, server actions, APIs
lib/          → lógica de domínio, auth, IA, integrações
supabase/     → scripts SQL (migrações manuais)
scripts/      → CLI e testes auxiliares
docs/         → documentação v1.0
middleware.ts → proteção de rotas por perfil
```

Detalhes: [docs/02-estrutura-pastas.md](./docs/02-estrutura-pastas.md)

---

## Perfis de acesso

| Perfil | Acesso |
|--------|--------|
| **Administrador** | Tudo: obras, clientes, gastos, notas, admin, auditoria |
| **Funcionário** | Portal: enviar e ver próprias notas |
| **Diretoria** | Dashboard e financeiro (somente leitura) |

Matriz completa: [docs/06-fluxo-permissoes.md](./docs/06-fluxo-permissoes.md)

---

## Documentação completa

| # | Tópico | Link |
|---|--------|------|
| 1 | Arquitetura | [docs/01-arquitetura.md](./docs/01-arquitetura.md) |
| 2 | Estrutura de pastas | [docs/02-estrutura-pastas.md](./docs/02-estrutura-pastas.md) |
| 3 | Banco de dados | [docs/03-banco-de-dados.md](./docs/03-banco-de-dados.md) |
| 4 | Relação entre tabelas | [docs/04-relacao-tabelas.md](./docs/04-relacao-tabelas.md) |
| 5 | Autenticação | [docs/05-fluxo-autenticacao.md](./docs/05-fluxo-autenticacao.md) |
| 6 | Permissões | [docs/06-fluxo-permissoes.md](./docs/06-fluxo-permissoes.md) |
| 7 | Portal de Notas | [docs/07-fluxo-portal-notas.md](./docs/07-fluxo-portal-notas.md) |
| 8 | Fluxo administrativo | [docs/08-fluxo-administrativo.md](./docs/08-fluxo-administrativo.md) |
| 9 | Dashboard | [docs/09-dashboard.md](./docs/09-dashboard.md) |
| 10 | Auditoria | [docs/10-auditoria.md](./docs/10-auditoria.md) |
| 11 | Variáveis de ambiente | [docs/11-variaveis-ambiente.md](./docs/11-variaveis-ambiente.md) |
| 12 | Deploy Vercel | [docs/12-deploy-vercel.md](./docs/12-deploy-vercel.md) |
| 13 | SQLs obrigatórios | [docs/13-sql-obrigatorios.md](./docs/13-sql-obrigatorios.md) |
| 14 | Checklist novos ambientes | [docs/14-checklist-novos-ambientes.md](./docs/14-checklist-novos-ambientes.md) |
| 15 | Manual funcionários | [docs/15-manual-funcionarios.md](./docs/15-manual-funcionarios.md) |
| 16 | Manual administradores | [docs/16-manual-administradores.md](./docs/16-manual-administradores.md) |
| 17 | Backup | [docs/17-manual-backup.md](./docs/17-manual-backup.md) |
| 18 | Recuperação | [docs/18-manual-recuperacao.md](./docs/18-manual-recuperacao.md) |
| 19 | Roadmap | [docs/19-plano-futuras-versoes.md](./docs/19-plano-futuras-versoes.md) |

---

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run admin:create-user` | Criar administrador via CLI |
| `npm run test:whatsapp` | Testes webhook WhatsApp |
| `npm run test:auditoria` | Testes rotas auditoria |

---

## Licença

Projeto privado — Cedro Obras. Uso interno.
