# 12. Deploy na Vercel

## Pré-requisitos

1. Conta [Vercel](https://vercel.com)
2. Projeto Supabase configurado com SQLs aplicados (ver [13-sql-obrigatorios.md](./13-sql-obrigatorios.md))
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## Passo a passo

### 1. Conectar repositório

1. Vercel Dashboard → **Add New Project**
2. Importar repositório `cedro-os`
3. Framework: **Next.js** (detectado automaticamente)
4. Build Command: `npm run build`
5. Output: padrão Next.js

### 2. Variáveis de ambiente

Em **Settings → Environment Variables**, adicionar todas de [11-variaveis-ambiente.md](./11-variaveis-ambiente.md):

- Production, Preview e Development conforme necessidade
- Marcar secrets como **Sensitive**

### 3. Deploy

```bash
git push origin main   # deploy automático via Git
```

Ou deploy manual:

```bash
npx vercel --prod
```

### 4. Domínio

1. Vercel → Project → **Domains**
2. Adicionar domínio customizado (ex.: `app.cedroobras.com.br`)
3. Configurar DNS conforme instruções Vercel

### 5. Supabase — URLs autorizadas

No Supabase Dashboard → **Authentication → URL Configuration**:

| Campo | Valor |
|-------|-------|
| Site URL | `https://seu-dominio.vercel.app` |
| Redirect URLs | `https://seu-dominio.vercel.app/auth/callback` |

### 6. WhatsApp webhook (se usar)

Meta Developer Console → Webhook URL:

```
https://seu-dominio.vercel.app/api/webhooks/whatsapp
```

Verify Token = valor de `WHATSAPP_VERIFY_TOKEN`

### 7. Pós-deploy

1. Executar [checklist](./14-checklist-novos-ambientes.md)
2. Criar admin: `npm run admin:create-user` (local com env de prod) ou via UI após primeiro admin
3. Validar: `node scripts/validation-pre-prod.mjs https://seu-dominio.vercel.app`

## Configurações recomendadas Vercel

| Setting | Valor |
|---------|-------|
| Node.js Version | 20.x |
| Serverless Function Region | Mesma região Supabase (ex.: São Paulo) |
| `serverActions.bodySizeLimit` | 11mb (já em `next.config.ts`) |

## Preview deployments

Cada PR gera preview URL. Use projeto Supabase **staging** separado para previews — nunca aponte preview para produção DB.

## Troubleshooting

| Problema | Solução |
|----------|---------|
| 500 em todas as páginas | Verificar env vars na Vercel |
| Login loop | Site URL / Redirect URLs no Supabase |
| Upload falha | RLS storage + bucket `notas-fiscais` |
| IA não funciona | `OPENAI_API_KEY` + créditos OpenAI |
