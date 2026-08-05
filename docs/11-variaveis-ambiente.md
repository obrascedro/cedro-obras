# 11. Variáveis de ambiente

Copie `.env.example` para `.env.local` (dev) ou configure na Vercel (produção).

## Obrigatórias

| Variável | Onde obter | Uso |
|----------|------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API (anon/publishable) | Client browser + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (**secret**) | Admin client, webhooks, auditoria |
| `OPENAI_API_KEY` | platform.openai.com | Leitura IA de notas, Engenheiro Cedro |

## WhatsApp (opcional)

| Variável | Descrição |
|----------|-----------|
| `WHATSAPP_ACCESS_TOKEN` | Token permanente Meta Business |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número WhatsApp Business |
| `WHATSAPP_VERIFY_TOKEN` | Token definido por você para verificação GET |
| `WHATSAPP_APP_SECRET` | App Secret Meta — **obrigatório em produção** para HMAC |
| `WHATSAPP_DEFAULT_OBRA_ID` | UUID da obra padrão para notas WhatsApp |

Sem `WHATSAPP_APP_SECRET`, o webhook aceita POST sem assinatura (modo inseguro).

## Rate limit distribuído (opcional)

| Variável | Descrição |
|----------|-----------|
| `UPSTASH_REDIS_REST_URL` | URL REST Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash |

Sem Upstash, rate limit usa memória local (ok para dev; limitado em Vercel multi-instância).

## Scripts CLI (não commitar)

| Variável | Uso |
|----------|-----|
| `ADMIN_EMAIL` | Email do admin inicial (padrão: admin@cedroobras.com.br) |
| `ADMIN_PASSWORD` | Senha forte, mín. 12 caracteres — `npm run admin:create-user` |

## Variáveis legadas / ignoradas

| Variável | Status |
|----------|--------|
| `PORTAL_NOTAS_ACCESS_CODE` | Legado — login unificado substituiu código de acesso |

## Segurança

- **Nunca** commitar `.env.local`
- **Nunca** expor `SUPABASE_SERVICE_ROLE_KEY` no client
- Rotacionar keys se vazamento suspeito
- Usar Vercel **Encrypted** env vars em produção

## Exemplo `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...

WHATSAPP_VERIFY_TOKEN=seu_token_secreto
WHATSAPP_APP_SECRET=seu_app_secret_meta
WHATSAPP_DEFAULT_OBRA_ID=uuid-da-obra
```
