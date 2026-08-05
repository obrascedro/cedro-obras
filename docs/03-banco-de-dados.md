# 3. Banco de dados

O Cedro Obras usa **PostgreSQL** gerenciado pelo Supabase. Tabelas core de obras existem antes dos scripts do repositório; scripts em `supabase/` estendem o schema.

## Tabelas core (pré-existentes)

Criadas fora deste repositório, referenciadas pelo app:

### `obras`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador |
| `nome` | text | Nome da obra |
| `status` | text | Ex.: Planejamento, Em andamento |
| `orcamento_previsto` | numeric | Orçamento |
| `valor_recebido` | numeric | Valor recebido |
| `gasto_realizado` | numeric | Gasto acumulado |
| `cliente_id` | uuid FK | → `clientes.id` |
| `data_inicio` | date | Início |
| `data_previsao_termino` | date | Previsão |

### `clientes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `nome` | text | Razão social / nome |
| `documento` | text | CPF/CNPJ (opcional) |

### `gastos_obra`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `obra_id` | uuid FK | → `obras.id` |
| `descricao` | text | Item / serviço |
| `categoria` | text | Material, Mão de obra, etc. |
| `etapa` | text | Fundação, Alvenaria, etc. |
| `valor_total` | numeric | Valor |
| `data_gasto` | date | Data do gasto |
| `fornecedor` | text | Opcional |
| `nota_fiscal_id` | uuid | Vínculo com nota (opcional) |

---

## Tabelas de autenticação

### `auth.users` (Supabase Auth)

Gerenciada pelo Supabase. Não alterar diretamente.

### `profiles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK FK | → `auth.users.id` |
| `nome` | text | Nome exibido |
| `role` | text | `admin`, `funcionario`, `diretoria` |
| `funcionario_id` | uuid FK | → `portal_funcionarios.id` |
| `ativo` | boolean | Conta ativa |
| `email` | text | Denormalizado (admin-funcionarios.sql) |
| `criado_em` | timestamptz | |

---

## Portal e funcionários

### `portal_funcionarios`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `nome` | text UNIQUE | Nome do funcionário |
| `ativo` | boolean | Ativo no portal |

### `funcionario_obras`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `funcionario_id` | uuid FK | → `portal_funcionarios.id` |
| `obra_id` | uuid FK | → `obras.id` |
| `criado_em` | timestamptz | |
| PK | (funcionario_id, obra_id) | |

Define quais obras cada funcionário pode selecionar no portal.

---

## Notas fiscais

### `notas_fiscais`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `obra_id` | uuid FK | → `obras.id` |
| `arquivo_path` | text | Caminho no Storage |
| `arquivo_nome` | text | Nome original |
| `arquivo_tipo` | text | MIME |
| `arquivo_tamanho` | bigint | Bytes |
| `fornecedor` | text | |
| `cnpj` | text | |
| `data_nota` | date | |
| `valor_total` | numeric | |
| `observacoes` | text | |
| `origem` | text | `manual`, `portal_funcionario`, `whatsapp` |
| `status_processamento` | text | Ver fluxo de aprovação |
| `auth_user_id` | uuid FK | Dono (portal) |
| `funcionario_id` | uuid FK | → `portal_funcionarios` |
| `enviado_por_nome` | text | |
| `aprovado_por_nome` | text | |
| `leitura_json` | jsonb | Resultado IA |
| `itens_json` | jsonb | Itens classificados |
| `criado_em` | timestamptz | |

**Status:** `aguardando` → `processando` → `pendente_aprovacao` → `aprovada` / `rejeitada` / `correcao_solicitada` / `erro`

### `notas_fiscais_eventos`

Histórico de ações por nota (enviada, aprovada, etc.).

### Storage: bucket `notas-fiscais`

Arquivos privados (PDF, PNG, JPG). Acesso via policies RLS + signed URLs.

---

## IA e classificação

### `classificacoes_aprendidas`

Correções do admin viram regras para classificação futura (`termo_chave`, `categoria`, `etapa`).

### `assistente_conversas` / `assistente_mensagens`

Histórico do Engenheiro Cedro. Coluna `usuario_id` para ownership por admin.

---

## Auditoria

### `audit_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `created_at` | timestamptz | |
| `usuario_id` | uuid | Quem executou |
| `usuario_nome` | text | |
| `usuario_role` | text | |
| `modulo` | text | auth, notas_fiscais, etc. |
| `acao` | text | login, aprovacao, etc. |
| `descricao` | text | Texto legível |
| `tabela` | text | Tabela afetada |
| `registro_id` | uuid | ID do registro |

Triggers em `obras`, `clientes` e `gastos_obra` geram logs automáticos de INSERT/UPDATE/DELETE.

---

## Funções SQL auxiliares (RLS)

| Função | Retorno | Uso |
|--------|---------|-----|
| `is_admin_ativo()` | boolean | Admin autenticado e ativo |
| `is_funcionario_ativo()` | boolean | Funcionário autenticado e ativo |
| `is_diretoria_ativo()` | boolean | Diretoria autenticada e ativa |
| `meu_funcionario_id()` | uuid | `funcionario_id` do perfil logado |

Definidas em `portal-minhas-notas-rls.sql` e `production-rls-hardening.sql`.
