# 15. Manual — adicionar novos funcionários

## Visão geral

Um funcionário precisa de **três vínculos**:

1. Registro em `portal_funcionarios` (cadastro nominal)
2. Usuário Auth + `profiles` com `role = funcionario`
3. Obras autorizadas em `funcionario_obras`

## Método 1 — Painel Admin (recomendado)

### Passo 1: Acessar gestão

1. Login como **admin**
2. Ir em **Admin → Funcionários** (`/admin/funcionarios`)

### Passo 2: Criar usuário

Preencher:

| Campo | Exemplo |
|-------|---------|
| Nome | João Silva |
| E-mail | joao.silva@empresa.com |
| Senha temporária | Mín. 8 caracteres |
| Perfil | Funcionário |

Clicar **Criar**. O sistema:

- Cria usuário no Supabase Auth
- Cria/atualiza `profiles` com `role = funcionario`
- Vincula `portal_funcionarios` pelo nome (match automático)
- Registra auditoria

### Passo 3: Vincular obras

**v1.0:** via SQL Editor (UI prevista v2.0):

```sql
-- Vincular João Silva à obra específica
INSERT INTO public.funcionario_obras (funcionario_id, obra_id)
SELECT pf.id, o.id
FROM public.portal_funcionarios pf
CROSS JOIN public.obras o
WHERE pf.nome = 'João Silva'
  AND o.nome = 'Residencial Exemplo'
ON CONFLICT DO NOTHING;
```

Para dar acesso a **todas** as obras:

```sql
INSERT INTO public.funcionario_obras (funcionario_id, obra_id)
SELECT pf.id, o.id
FROM public.portal_funcionarios pf
CROSS JOIN public.obras o
WHERE pf.nome = 'João Silva' AND pf.ativo = true
ON CONFLICT DO NOTHING;
```

### Passo 4: Entregar credenciais

Informar ao funcionário:

- URL: `https://app.cedroobras.com.br/login`
- E-mail e senha temporária
- Pedir troca de senha no primeiro acesso (via Supabase ou admin)

## Método 2 — SQL + Auth manual

Se o cadastro portal já existir:

```sql
-- 1. Garantir cadastro portal
INSERT INTO public.portal_funcionarios (nome, ativo)
VALUES ('João Silva', true)
ON CONFLICT (nome) DO UPDATE SET ativo = true;
```

Depois criar usuário Auth via Admin UI ou script, e vincular:

```sql
UPDATE public.profiles p
SET funcionario_id = pf.id, role = 'funcionario', ativo = true
FROM public.portal_funcionarios pf
WHERE p.nome = 'João Silva' AND pf.nome = 'João Silva';
```

## Desativar funcionário

1. Admin → Funcionários → desativar conta (`ativo = false`)
2. Funcionário não consegue mais login
3. Notas anteriores permanecem no histórico

## Problemas comuns

| Problema | Solução |
|----------|---------|
| "Perfil incompleto" no portal | Vincular `funcionario_id` em `profiles` |
| Dropdown de obras vazio | Inserir linhas em `funcionario_obras` |
| Nome não vincula automaticamente | Nome em `profiles` deve coincidir com `portal_funcionarios` |
| Funcionário vê obra errada | Remover vínculos extras em `funcionario_obras` |

## Checklist novo funcionário

- [ ] Cadastro em `portal_funcionarios`
- [ ] Usuário Auth criado
- [ ] `profiles.funcionario_id` vinculado
- [ ] Obras autorizadas em `funcionario_obras`
- [ ] Teste de login e envio de nota
