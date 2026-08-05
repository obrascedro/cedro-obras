# 9. Dashboard

Rota: **`/dashboard`**

Acessível por **admin** e **diretoria**.

## Objetivo

Visão consolidada da saúde financeira das obras: orçamento, gastos, recebimentos, alertas e notas pendentes.

## Fontes de dados

| Query | Tabela | Limite |
|-------|--------|--------|
| Obras | `obras` + join `clientes` | Todas (ordenadas) |
| Gastos agregados | `gastos_obra` | 2.000 registros recentes |
| Movimentações recentes | `gastos_obra` | 10 últimos |
| Notas (status) | `notas_fiscais` | 500 recentes |

Cliente Supabase: `createSupabaseServerClient()` (sessão autenticada).

## Componentes

| Componente | Função |
|------------|--------|
| `SummaryCard` | Cards de totais (contratado, recebido, gasto, lucro) |
| `DashboardCharts` | Gráficos Recharts (gastos por etapa, por obra) |
| `DashboardNotasPendentes` | Contagem de notas aguardando aprovação |

## Indicadores calculados

- **Valor contratado** — soma `orcamento_previsto`
- **Total recebido** — soma `valor_recebido`
- **Gasto realizado** — soma `gasto_realizado` ou agregado de `gastos_obra`
- **Lucro estimado** — `calcularLucro()` em `lib/dashboard.ts`
- **Alertas** — obras acima de 90% do orçamento, atrasos, etc.

## Badge de pendências

`PageShell` exibe contagem de notas pendentes via `contarNotasPendentesAdminAction()` (admin only).

## Performance

- Queries com `.limit()` para evitar timeout em bases grandes
- Para volumes muito altos (>2.000 gastos), considerar agregações SQL materializadas (v2.0)

## Erros comuns

| Sintoma | Causa provável |
|---------|----------------|
| Dashboard vazio | RLS não aplicado ou sessão expirada |
| Cards zerados | Tabelas `obras`/`gastos_obra` sem dados |
| Erro ao carregar | Credenciais Supabase incorretas |
