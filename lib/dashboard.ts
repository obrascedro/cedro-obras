export type ObraDashboard = {
  id: string;
  nome: string;
  status: string;
  orcamento_previsto: number | null;
  valor_recebido: number | null;
  gasto_realizado: number | null;
  lucro_estimado: number | null;
  data_previsao_termino: string | null;
  clientes: { nome: string } | { nome: string }[] | null;
};

export type GastoDashboard = {
  obra_id?: string;
  etapa: string;
  categoria: string;
  valor_total: number | null;
  data_gasto?: string | null;
  criado_em?: string | null;
};

export type GastoRecente = {
  id: string;
  data_gasto: string | null;
  descricao: string;
  etapa: string;
  valor_total: number | null;
  obra_id: string;
  obras: { nome: string } | { nome: string }[] | null;
};

export type DistribuicaoItem = {
  label: string;
  total: number;
  percentual?: number;
};

export type AlertaObra = {
  id: string;
  obraId: string;
  nome: string;
  tipo:
    | "orcamento_excedido"
    | "lucro_negativo"
    | "prazo_proximo"
    | "atrasada"
    | "sem_movimentacao";
  mensagem: string;
};

export function getObraNome(
  obras: GastoRecente["obras"]
): string {
  if (!obras) return "—";
  if (Array.isArray(obras)) return obras[0]?.nome ?? "—";
  return obras.nome;
}

export function getClienteNome(
  clientes: ObraDashboard["clientes"]
): string {
  if (!clientes) return "—";
  if (Array.isArray(clientes)) return clientes[0]?.nome ?? "—";
  return clientes.nome;
}

export function calcularLucro(obra: ObraDashboard): number {
  if (obra.lucro_estimado !== null && obra.lucro_estimado !== undefined) {
    return obra.lucro_estimado;
  }

  return (obra.valor_recebido ?? 0) - (obra.gasto_realizado ?? 0);
}

export function agruparPorCampo(
  gastos: GastoDashboard[],
  campo: "etapa" | "categoria"
): DistribuicaoItem[] {
  const mapa = new Map<string, number>();

  for (const gasto of gastos) {
    const label = String(gasto[campo] ?? "").trim() || "Não informado";
    mapa.set(label, (mapa.get(label) ?? 0) + (gasto.valor_total ?? 0));
  }

  const totalGeral = Array.from(mapa.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(mapa.entries())
    .map(([label, total]) => ({
      label,
      total,
      percentual:
        totalGeral > 0 ? Math.round((total / totalGeral) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildUltimoGastoPorObra(
  gastos: Pick<GastoDashboard, "obra_id" | "data_gasto" | "criado_em">[]
): Map<string, string> {
  const mapa = new Map<string, string>();

  for (const gasto of gastos) {
    if (!gasto.obra_id) {
      continue;
    }

    const data =
      gasto.data_gasto ?? gasto.criado_em?.slice(0, 10) ?? null;

    if (!data) {
      continue;
    }

    const atual = mapa.get(gasto.obra_id);
    if (!atual || data > atual) {
      mapa.set(gasto.obra_id, data);
    }
  }

  return mapa;
}

function obraAtiva(status: string) {
  return status !== "Concluída" && status !== "Cancelada";
}

function diasAteTermino(dataTermino: string | null): number | null {
  if (!dataTermino) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const termino = new Date(`${dataTermino}T00:00:00`);
  termino.setHours(0, 0, 0, 0);

  return Math.ceil((termino.getTime() - hoje.getTime()) / 86400000);
}

export function gerarAlertasDashboard(
  obras: ObraDashboard[],
  ultimoGastoPorObra: Map<string, string>
): AlertaObra[] {
  const alertas: AlertaObra[] = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const limiteMovimentacao = new Date(hoje);
  limiteMovimentacao.setDate(limiteMovimentacao.getDate() - 15);

  for (const obra of obras) {
    const lucro = calcularLucro(obra);

    if (lucro < 0) {
      alertas.push({
        id: `${obra.id}-lucro`,
        obraId: obra.id,
        nome: obra.nome,
        tipo: "lucro_negativo",
        mensagem: "Obra com lucro estimado negativo.",
      });
    }

    if (
      obra.data_previsao_termino &&
      obraAtiva(obra.status)
    ) {
      const termino = new Date(`${obra.data_previsao_termino}T00:00:00`);
      termino.setHours(0, 0, 0, 0);

      if (termino < hoje) {
        alertas.push({
          id: `${obra.id}-atrasada`,
          obraId: obra.id,
          nome: obra.nome,
          tipo: "atrasada",
          mensagem: "Obra com prazo de término vencido.",
        });
      }
    }

    if (obraAtiva(obra.status)) {
      const ultimoGasto = ultimoGastoPorObra.get(obra.id);

      if (!ultimoGasto) {
        alertas.push({
          id: `${obra.id}-sem-mov`,
          obraId: obra.id,
          nome: obra.nome,
          tipo: "sem_movimentacao",
          mensagem: "Obra sem movimentação registrada.",
        });
      } else {
        const dataUltimoGasto = new Date(`${ultimoGasto}T00:00:00`);
        dataUltimoGasto.setHours(0, 0, 0, 0);

        if (dataUltimoGasto < limiteMovimentacao) {
          alertas.push({
            id: `${obra.id}-sem-mov`,
            obraId: obra.id,
            nome: obra.nome,
            tipo: "sem_movimentacao",
            mensagem: "Obra sem movimentação há mais de 15 dias.",
          });
        }
      }
    }
  }

  return alertas;
}

export function gerarAlertas(obras: ObraDashboard[]): AlertaObra[] {
  const alertas: AlertaObra[] = [];

  for (const obra of obras) {
    const orcamento = obra.orcamento_previsto ?? 0;
    const gasto = obra.gasto_realizado ?? 0;
    const lucro = calcularLucro(obra);
    const dias = diasAteTermino(obra.data_previsao_termino);

    if (orcamento > 0 && gasto > orcamento) {
      alertas.push({
        id: `${obra.id}-orcamento`,
        obraId: obra.id,
        nome: obra.nome,
        tipo: "orcamento_excedido",
        mensagem: "Gasto realizado acima do orçamento previsto.",
      });
    }

    if (lucro < 0) {
      alertas.push({
        id: `${obra.id}-lucro`,
        obraId: obra.id,
        nome: obra.nome,
        tipo: "lucro_negativo",
        mensagem: "Lucro estimado negativo.",
      });
    }

    if (
      dias !== null &&
      dias >= 0 &&
      dias <= 30 &&
      obra.status !== "Concluída" &&
      obra.status !== "Cancelada"
    ) {
      alertas.push({
        id: `${obra.id}-prazo`,
        obraId: obra.id,
        nome: obra.nome,
        tipo: "prazo_proximo",
        mensagem:
          dias === 0
            ? "Data prevista de término é hoje."
            : `Término previsto em ${dias} dia(s).`,
      });
    }
  }

  return alertas;
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "Em andamento":
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300";
    case "Concluída":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Pausada":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300";
    case "Cancelada":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function alertaBadgeClass(tipo: AlertaObra["tipo"]) {
  switch (tipo) {
    case "orcamento_excedido":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "lucro_negativo":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    case "prazo_proximo":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
    case "atrasada":
      return "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300";
    case "sem_movimentacao":
      return "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
  }
}
