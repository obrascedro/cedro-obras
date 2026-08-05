import { agruparPorCampo, calcularLucro } from "@/lib/dashboard";
import { agruparGastosPorEtapaDetalhado } from "@/lib/gastos-etapa";
import { formatCurrency } from "@/lib/format";
import type {
  GastoRegistro,
  GraficoAssistente,
  IndicadorAssistente,
  ObraResumo,
  RespostaEngenheiroCedro,
  SnapshotEngenheiroCedro,
} from "@/lib/engenheiro-cedro-types";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolverObraContexto(
  snapshot: SnapshotEngenheiroCedro,
  obraId?: string | null,
  pergunta?: string
): ObraResumo | null {
  if (obraId) {
    return snapshot.obras.find((o) => o.id === obraId) ?? null;
  }

  if (!pergunta) return null;

  const texto = normalizar(pergunta);
  for (const obra of snapshot.obras) {
    const nomeNorm = normalizar(obra.nome);
    if (texto.includes(nomeNorm)) return obra;
  }

  const ativas = snapshot.obras.filter(
    (o) => o.status === "Em andamento" || o.status === "Planejamento"
  );
  return ativas.length === 1 ? ativas[0] : null;
}

function filtrarGastosObra(gastos: GastoRegistro[], obraId: string) {
  return gastos.filter((g) => g.obra_id === obraId);
}

function respostaBase(
  intent: string,
  texto: string,
  extras?: Partial<RespostaEngenheiroCedro>
): RespostaEngenheiroCedro {
  return {
    texto,
    indicadores: extras?.indicadores ?? [],
    graficos: extras?.graficos ?? [],
    fonte: extras?.fonte ?? "dados",
    intent,
  };
}

export function responderGastoTotalObra(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  if (!obra) {
    const total = snapshot.totais.gastoGeral;
    return respostaBase(
      "gasto_total_obra",
      `Você já gastou **${formatCurrency(total)}** em todas as obras cadastradas.`,
      {
        indicadores: [
          {
            tipo: "info",
            titulo: "Gasto total",
            mensagem: formatCurrency(total),
          },
        ],
      }
    );
  }

  const gastos = filtrarGastosObra(snapshot.gastos, obra.id);
  const porEtapa = agruparGastosPorEtapaDetalhado(gastos);
  const percentualOrcamento =
    obra.orcamento_previsto > 0
      ? Math.round((obra.gasto_realizado / obra.orcamento_previsto) * 100)
      : null;

  const indicadores: IndicadorAssistente[] = [
    {
      tipo: "info",
      titulo: obra.nome,
      mensagem: `Gasto realizado: ${formatCurrency(obra.gasto_realizado)}`,
    },
  ];

  if (percentualOrcamento !== null) {
    indicadores.push({
      tipo: percentualOrcamento >= 90 ? "atencao" : "info",
      titulo: "Orçamento utilizado",
      mensagem: `${percentualOrcamento}% do orçamento previsto (${formatCurrency(obra.orcamento_previsto)})`,
    });
  }

  const graficos: GraficoAssistente[] =
    porEtapa.length > 0
      ? [
          {
            tipo: "bar",
            titulo: `Gastos por etapa — ${obra.nome}`,
            dados: porEtapa.slice(0, 8).map((e) => ({
              label: e.etapa,
              valor: e.total,
              percentual: e.percentual,
            })),
          },
        ]
      : [];

  return respostaBase(
    "gasto_total_obra",
    `Na obra **${obra.nome}**, você já gastou **${formatCurrency(obra.gasto_realizado)}**${
      percentualOrcamento !== null
        ? ` — ${percentualOrcamento}% do orçamento de ${formatCurrency(obra.orcamento_previsto)}`
        : ""
    }.`,
    { indicadores, graficos }
  );
}

export function responderGastoEtapa(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null,
  etapaBusca: string
): RespostaEngenheiroCedro {
  const etapaNorm = normalizar(etapaBusca);
  const gastosFiltrados = obra
    ? filtrarGastosObra(snapshot.gastos, obra.id)
    : snapshot.gastos;

  const gastosEtapa = gastosFiltrados.filter((g) =>
    normalizar(g.etapa).includes(etapaNorm)
  );

  const total = gastosEtapa.reduce((s, g) => s + g.valor_total, 0);

  if (gastosEtapa.length === 0) {
    return respostaBase(
      "gasto_etapa",
      `Não encontrei gastos na etapa **${etapaBusca}**${
        obra ? ` na obra ${obra.nome}` : ""
      }.`
    );
  }

  const porCategoria = agruparPorCampo(
    gastosEtapa.map((g) => ({
      etapa: g.etapa,
      categoria: g.categoria,
      valor_total: g.valor_total,
    })),
    "categoria"
  );

  const indicadores: IndicadorAssistente[] = [];
  if (obra && obra.orcamento_previsto > 0) {
    const pct = Math.round((total / obra.orcamento_previsto) * 100);
    if (pct >= 90) {
      indicadores.push({
        tipo: "atencao",
        titulo: "Atenção",
        mensagem: `Os gastos de ${etapaBusca} ultrapassaram ${pct}% do orçamento total da obra.`,
      });
    }
  }

  return respostaBase(
    "gasto_etapa",
    `Você gastou **${formatCurrency(total)}** em **${etapaBusca}**${
      obra ? ` na obra ${obra.nome}` : " em todas as obras"
    } (${gastosEtapa.length} lançamento(s)).`,
    {
      indicadores,
      graficos: [
        {
          tipo: "pie",
          titulo: `Categorias — ${etapaBusca}`,
          dados: porCategoria.slice(0, 6).map((c) => ({
            label: c.label,
            valor: c.total,
            percentual: c.percentual,
          })),
        },
      ],
    }
  );
}

export function responderFornecedorTop(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  const gastos = obra
    ? filtrarGastosObra(snapshot.gastos, obra.id)
    : snapshot.gastos;

  const mapa = new Map<string, number>();
  for (const g of gastos) {
    const nome = (g.fornecedor ?? "Sem fornecedor").trim();
    mapa.set(nome, (mapa.get(nome) ?? 0) + g.valor_total);
  }

  const ranking = Array.from(mapa.entries())
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor);

  if (ranking.length === 0) {
    return respostaBase(
      "fornecedor_top",
      "Ainda não há gastos com fornecedor registrados."
    );
  }

  const top = ranking[0];
  const media =
    ranking.reduce((s, r) => s + r.valor, 0) / ranking.length;
  const desvioTop = media > 0 ? Math.round(((top.valor - media) / media) * 100) : 0;

  const indicadores: IndicadorAssistente[] = [
    {
      tipo: "info",
      titulo: "Maior fornecedor",
      mensagem: `${top.label} — ${formatCurrency(top.valor)}`,
    },
  ];

  if (desvioTop > 10) {
    indicadores.push({
      tipo: "atencao",
      titulo: "Concentração",
      mensagem: `O fornecedor ${top.label} está ${desvioTop}% acima da média dos demais.`,
    });
  }

  return respostaBase(
    "fornecedor_top",
    `O fornecedor que mais recebeu foi **${top.label}**, com **${formatCurrency(top.valor)}**${
      obra ? ` na obra ${obra.nome}` : ""
    }.`,
    {
      indicadores,
      graficos: [
        {
          tipo: "bar",
          titulo: "Top fornecedores",
          dados: ranking.slice(0, 6).map((r) => ({
            label: r.label,
            valor: r.valor,
          })),
        },
      ],
    }
  );
}

export function responderOrcamentoRestante(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  const alvo = obra ?? {
    nome: "Todas as obras",
    orcamento_previsto: snapshot.totais.orcamentoGeral,
    gasto_realizado: snapshot.totais.gastoGeral,
  };

  const orcamento = "orcamento_previsto" in alvo ? alvo.orcamento_previsto : 0;
  const gasto = "gasto_realizado" in alvo ? alvo.gasto_realizado : 0;

  if (orcamento <= 0) {
    return respostaBase(
      "orcamento_restante",
      `A obra **${alvo.nome}** não possui orçamento previsto cadastrado.`
    );
  }

  const restante = orcamento - gasto;
  const pct = Math.round((gasto / orcamento) * 100);

  return respostaBase(
    "orcamento_restante",
    restante >= 0
      ? `Faltam **${formatCurrency(restante)}** para atingir o orçamento de **${formatCurrency(orcamento)}** na obra **${alvo.nome}** (${pct}% já utilizado).`
      : `O orçamento de **${formatCurrency(orcamento)}** na obra **${alvo.nome}** foi ultrapassado em **${formatCurrency(Math.abs(restante))}** (${pct}% do previsto).`,
    {
      indicadores: [
        {
          tipo: restante < 0 ? "alerta" : pct >= 90 ? "atencao" : "info",
          titulo: "Saldo orçamentário",
          mensagem:
            restante >= 0
              ? `${formatCurrency(restante)} disponíveis (${100 - pct}% restante)`
              : `Estouro de ${formatCurrency(Math.abs(restante))}`,
        },
      ],
    }
  );
}

export function responderObraMaiorLucro(
  snapshot: SnapshotEngenheiroCedro
): RespostaEngenheiroCedro {
  if (snapshot.obras.length === 0) {
    return respostaBase("obra_maior_lucro", "Nenhuma obra cadastrada ainda.");
  }

  const ordenadas = [...snapshot.obras].sort(
    (a, b) => b.lucro_estimado - a.lucro_estimado
  );
  const top = ordenadas[0];
  const pior = ordenadas[ordenadas.length - 1];

  return respostaBase(
    "obra_maior_lucro",
    `A obra mais lucrativa é **${top.nome}**, com lucro estimado de **${formatCurrency(top.lucro_estimado)}** (recebido ${formatCurrency(top.valor_recebido)} − gasto ${formatCurrency(top.gasto_realizado)}).`,
    {
      indicadores: [
        {
          tipo: top.lucro_estimado >= 0 ? "sucesso" : "alerta",
          titulo: "Maior lucro",
          mensagem: `${top.nome}: ${formatCurrency(top.lucro_estimado)}`,
        },
        ...(pior.id !== top.id
          ? [
              {
                tipo: (pior.lucro_estimado >= 0 ? "info" : "alerta") as IndicadorAssistente["tipo"],
                titulo: "Menor lucro",
                mensagem: `${pior.nome}: ${formatCurrency(pior.lucro_estimado)}`,
              },
            ]
          : []),
      ],
      graficos: [
        {
          tipo: "bar",
          titulo: "Lucro por obra",
          dados: ordenadas.slice(0, 8).map((o) => ({
            label: o.nome,
            valor: o.lucro_estimado,
          })),
        },
      ],
    }
  );
}

export function responderLucratividade(
  snapshot: SnapshotEngenheiroCedro
): RespostaEngenheiroCedro {
  const { recebidoGeral, gastoGeral, lucroGeral } = snapshot.totais;
  const margem =
    recebidoGeral > 0 ? Math.round((lucroGeral / recebidoGeral) * 100) : 0;
  const obrasNegativas = snapshot.obras.filter((o) => o.lucro_estimado < 0);

  return respostaBase(
    "lucratividade",
    `Sua lucratividade geral é **${formatCurrency(lucroGeral)}** (margem de **${margem}%** sobre ${formatCurrency(recebidoGeral)} recebidos). Total gasto: ${formatCurrency(gastoGeral)}.`,
    {
      indicadores: [
        {
          tipo: lucroGeral >= 0 ? "sucesso" : "alerta",
          titulo: "Lucro geral",
          mensagem: `${formatCurrency(lucroGeral)} (${margem}% de margem)`,
        },
        ...(obrasNegativas.length > 0
          ? [
              {
                tipo: "atencao" as const,
                titulo: "Obras no prejuízo",
                mensagem: `${obrasNegativas.length} obra(s) com lucro negativo: ${obrasNegativas.map((o) => o.nome).join(", ")}`,
              },
            ]
          : []),
      ],
    }
  );
}

export function responderEtapaMaisCara(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  const gastos = obra
    ? filtrarGastosObra(snapshot.gastos, obra.id)
    : snapshot.gastos;

  const porEtapa = agruparGastosPorEtapaDetalhado(gastos);
  if (porEtapa.length === 0) {
    return respostaBase("etapa_mais_cara", "Não há gastos por etapa registrados.");
  }

  const top = porEtapa[0];
  return respostaBase(
    "etapa_mais_cara",
    `A etapa que mais consome recursos${obra ? ` na obra ${obra.nome}` : ""} é **${top.etapa}**, com **${formatCurrency(top.total)}** (${top.percentual}% do total).`,
    {
      graficos: [
        {
          tipo: "bar",
          titulo: "Gastos por etapa",
          dados: porEtapa.slice(0, 8).map((e) => ({
            label: e.etapa,
            valor: e.total,
            percentual: e.percentual,
          })),
        },
      ],
    }
  );
}

export function responderNotasDuplicadas(
  snapshot: SnapshotEngenheiroCedro
): RespostaEngenheiroCedro {
  const grupos = new Map<string, typeof snapshot.notas>();

  for (const nota of snapshot.notas) {
    const chave = [
      nota.obra_id,
      normalizar(nota.fornecedor ?? ""),
      nota.data_nota ?? "",
      nota.valor_total.toFixed(2),
    ].join("|");
    const lista = grupos.get(chave) ?? [];
    lista.push(nota);
    grupos.set(chave, lista);
  }

  const duplicadas = Array.from(grupos.values()).filter((g) => g.length > 1);

  if (duplicadas.length === 0) {
    return respostaBase(
      "notas_duplicadas",
      "Não identifiquei notas fiscais duplicadas (mesmo fornecedor, data e valor)."
    );
  }

  const total = duplicadas.reduce((s, g) => s + g.length, 0);
  const exemplos = duplicadas
    .slice(0, 3)
    .map(
      (grupo) =>
        `${grupo[0].fornecedor ?? "Sem fornecedor"} — ${formatCurrency(grupo[0].valor_total)} em ${grupo[0].data_nota ?? "?"} (${grupo.length}x)`
    )
    .join("; ");

  return respostaBase(
    "notas_duplicadas",
    `Encontrei **${duplicadas.length} grupo(s)** de possíveis notas duplicadas (${total} registros). Exemplos: ${exemplos}.`,
    {
      indicadores: duplicadas.map((grupo, i) => ({
        tipo: "atencao" as const,
        titulo: `Duplicata ${i + 1}`,
        mensagem: `${grupo[0].fornecedor ?? "Sem fornecedor"} — ${formatCurrency(grupo[0].valor_total)} (${grupo.length} notas)`,
      })),
    }
  );
}

export function responderComprasSuspeitas(
  snapshot: SnapshotEngenheiroCedro
): RespostaEngenheiroCedro {
  const suspeitas: IndicadorAssistente[] = [];

  for (const gasto of snapshot.gastos) {
    if (gasto.valor_total >= 10000 && !gasto.fornecedor) {
      suspeitas.push({
        tipo: "atencao",
        titulo: "Gasto alto sem fornecedor",
        mensagem: `${gasto.descricao} — ${formatCurrency(gasto.valor_total)} (${gasto.obra_nome})`,
      });
    }
  }

  const mediaPorDescricao = new Map<string, number[]>();
  for (const g of snapshot.gastos) {
    const chave = normalizar(g.descricao.split("(")[0]);
    if (chave.length < 4) continue;
    const lista = mediaPorDescricao.get(chave) ?? [];
    if (g.valor_unitario > 0) lista.push(g.valor_unitario);
    mediaPorDescricao.set(chave, lista);
  }

  for (const g of snapshot.gastos) {
    const chave = normalizar(g.descricao.split("(")[0]);
    const precos = mediaPorDescricao.get(chave) ?? [];
    if (precos.length < 3 || g.valor_unitario <= 0) continue;
    const media = precos.reduce((s, p) => s + p, 0) / precos.length;
    const desvio = ((g.valor_unitario - media) / media) * 100;
    if (desvio >= 30) {
      suspeitas.push({
        tipo: "alerta",
        titulo: "Preço acima da média",
        mensagem: `${g.descricao} custa ${Math.round(desvio)}% acima da média (${formatCurrency(g.valor_unitario)} vs ${formatCurrency(media)})`,
      });
    }
  }

  if (suspeitas.length === 0) {
    return respostaBase(
      "compras_suspeitas",
      "Não identifiquei compras suspeitas com os critérios atuais (valor alto sem fornecedor ou preço >30% acima da média histórica)."
    );
  }

  return respostaBase(
    "compras_suspeitas",
    `Identifiquei **${suspeitas.length} alerta(s)** de compras que merecem revisão:`,
    { indicadores: suspeitas.slice(0, 8) }
  );
}

export function responderRiscoPrejuizo(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  const alvos = obra ? [obra] : snapshot.obras.filter((o) => o.status === "Em andamento");
  const indicadores: IndicadorAssistente[] = [];

  for (const o of alvos) {
    if (o.lucro_estimado < 0) {
      indicadores.push({
        tipo: "alerta",
        titulo: o.nome,
        mensagem: `Lucro negativo de ${formatCurrency(o.lucro_estimado)}.`,
      });
      continue;
    }

    if (o.orcamento_previsto > 0 && o.gasto_realizado > o.orcamento_previsto) {
      indicadores.push({
        tipo: "alerta",
        titulo: o.nome,
        mensagem: `Orçamento estourado em ${formatCurrency(o.gasto_realizado - o.orcamento_previsto)}.`,
      });
      continue;
    }

    if (o.data_inicio && o.data_previsao_termino && o.orcamento_previsto > 0) {
      const inicio = new Date(`${o.data_inicio}T00:00:00`);
      const fim = new Date(`${o.data_previsao_termino}T00:00:00`);
      const hoje = new Date();
      const diasTotais = Math.max(
        1,
        Math.ceil((fim.getTime() - inicio.getTime()) / 86400000)
      );
      const diasDecorridos = Math.max(
        1,
        Math.ceil((hoje.getTime() - inicio.getTime()) / 86400000)
      );
      const burnRate = o.gasto_realizado / diasDecorridos;
      const diasRestantes = Math.max(
        0,
        Math.ceil((fim.getTime() - hoje.getTime()) / 86400000)
      );
      const projecao = o.gasto_realizado + burnRate * diasRestantes;

      if (projecao > o.orcamento_previsto && burnRate > 0) {
        const deficit = projecao - o.orcamento_previsto;
        const diasAteEstouro = Math.ceil(
          (o.orcamento_previsto - o.gasto_realizado) / burnRate
        );
        if (diasAteEstouro > 0 && diasAteEstouro <= 90) {
          indicadores.push({
            tipo: "atencao",
            titulo: o.nome,
            mensagem: `Existe risco de estouro financeiro em ~${diasAteEstouro} dias (projeção: ${formatCurrency(projecao)}).`,
          });
        } else if (diasAteEstouro <= 0) {
          indicadores.push({
            tipo: "alerta",
            titulo: o.nome,
            mensagem: `Ritmo de gastos indica estouro de ${formatCurrency(deficit)} até o término.`,
          });
        }
      }
    }
  }

  if (indicadores.length === 0) {
    return respostaBase(
      "risco_prejuizo",
      "Com base nos dados atuais, **não identifiquei risco imediato de prejuízo** nas obras analisadas."
    );
  }

  return respostaBase(
    "risco_prejuizo",
    `Identifiquei **${indicadores.length} alerta(s)** de risco financeiro:`,
    { indicadores }
  );
}

export function responderOrcamentoSuficiente(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  const alvo = obra ?? snapshot.obras.find((o) => o.status === "Em andamento") ?? snapshot.obras[0];

  if (!alvo) {
    return respostaBase("orcamento_suficiente", "Nenhuma obra para analisar.");
  }

  if (alvo.orcamento_previsto <= 0) {
    return respostaBase(
      "orcamento_suficiente",
      `A obra **${alvo.nome}** não tem orçamento previsto cadastrado — não é possível avaliar.`
    );
  }

  const pct = Math.round((alvo.gasto_realizado / alvo.orcamento_previsto) * 100);
  const restante = alvo.orcamento_previsto - alvo.gasto_realizado;
  const suficiente = restante >= 0 && pct < 95;

  let projecaoTexto = "";
  if (alvo.data_inicio && alvo.data_previsao_termino) {
    const inicio = new Date(`${alvo.data_inicio}T00:00:00`);
    const fim = new Date(`${alvo.data_previsao_termino}T00:00:00`);
    const hoje = new Date();
    const diasDecorridos = Math.max(
      1,
      Math.ceil((hoje.getTime() - inicio.getTime()) / 86400000)
    );
    const diasRestantes = Math.max(
      0,
      Math.ceil((fim.getTime() - hoje.getTime()) / 86400000)
    );
    const burnRate = alvo.gasto_realizado / diasDecorridos;
    const projecao = alvo.gasto_realizado + burnRate * diasRestantes;
    projecaoTexto = ` Projeção até o término: **${formatCurrency(projecao)}**.`;
  }

  return respostaBase(
    "orcamento_suficiente",
    suficiente
      ? `Sim, o orçamento de **${formatCurrency(alvo.orcamento_previsto)}** parece **suficiente** por enquanto (${pct}% utilizado, sobram ${formatCurrency(restante)}).${projecaoTexto}`
      : `**Atenção:** o orçamento de **${formatCurrency(alvo.orcamento_previsto)}** na obra **${alvo.nome}** ${restante < 0 ? "já foi ultrapassado" : "está quase esgotado"} (${pct}% utilizado).${projecaoTexto}`,
    {
      indicadores: [
        {
          tipo: suficiente ? "sucesso" : "alerta",
          titulo: alvo.nome,
          mensagem: `${pct}% do orçamento utilizado`,
        },
      ],
    }
  );
}

export function responderCompararObras(
  snapshot: SnapshotEngenheiroCedro
): RespostaEngenheiroCedro {
  const ativas = snapshot.obras.filter(
    (o) => o.status === "Em andamento" || o.status === "Concluída"
  );

  if (ativas.length < 2) {
    return respostaBase(
      "comparar_obras",
      "É necessário ter pelo menos duas obras para comparar."
    );
  }

  const linhas = ativas
    .map((o) => {
      const pct =
        o.orcamento_previsto > 0
          ? Math.round((o.gasto_realizado / o.orcamento_previsto) * 100)
          : null;
      return `• **${o.nome}**: gasto ${formatCurrency(o.gasto_realizado)}, lucro ${formatCurrency(o.lucro_estimado)}${pct !== null ? `, ${pct}% do orçamento` : ""}`;
    })
    .join("\n");

  return respostaBase(
    "comparar_obras",
    `Comparativo de obras:\n${linhas}`,
    {
      graficos: [
        {
          tipo: "bar",
          titulo: "Gasto realizado por obra",
          dados: ativas.map((o) => ({
            label: o.nome,
            valor: o.gasto_realizado,
          })),
        },
        {
          tipo: "bar",
          titulo: "Lucro estimado por obra",
          dados: ativas.map((o) => ({
            label: o.nome,
            valor: o.lucro_estimado,
          })),
        },
      ],
    }
  );
}

export function responderEconomizar(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  const gastos = obra
    ? filtrarGastosObra(snapshot.gastos, obra.id)
    : snapshot.gastos;

  const porCategoria = agruparPorCampo(
    gastos.map((g) => ({
      etapa: g.etapa,
      categoria: g.categoria,
      valor_total: g.valor_total,
    })),
    "categoria"
  );

  const porEtapa = agruparGastosPorEtapaDetalhado(gastos);
  const dicas: string[] = [];

  if (porEtapa[0]) {
    dicas.push(
      `A etapa **${porEtapa[0].etapa}** concentra ${porEtapa[0].percentual}% dos gastos — revise escopo e fornecedores.`
    );
  }

  if (porCategoria[0]) {
    dicas.push(
      `A categoria **${porCategoria[0].label}** representa ${porCategoria[0].percentual}% do total — negocie volume ou alternative materiais.`
    );
  }

  const semFornecedor = gastos.filter((g) => !g.fornecedor && g.valor_total > 500);
  if (semFornecedor.length > 0) {
    dicas.push(
      `${semFornecedor.length} gasto(s) acima de R$ 500 sem fornecedor — padronize lançamentos para comparar preços.`
    );
  }

  if (dicas.length === 0) {
    return respostaBase(
      "economizar",
      "Com os dados atuais, mantenha o controle por etapa e compare cotações entre fornecedores recorrentes."
    );
  }

  return respostaBase(
    "economizar",
    `Oportunidades de economia${obra ? ` na obra ${obra.nome}` : ""}:\n${dicas.map((d) => `• ${d}`).join("\n")}`,
    {
      graficos: [
        {
          tipo: "pie",
          titulo: "Distribuição por categoria",
          dados: porCategoria.slice(0, 6).map((c) => ({
            label: c.label,
            valor: c.total,
            percentual: c.percentual,
          })),
        },
      ],
    }
  );
}

export function responderCategoriasAcima(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): RespostaEngenheiroCedro {
  const alvo = obra ?? snapshot.obras[0];
  if (!alvo || alvo.orcamento_previsto <= 0) {
    return respostaBase(
      "categorias_acima",
      "Cadastre o orçamento previsto da obra para analisar categorias acima do previsto."
    );
  }

  const gastos = filtrarGastosObra(snapshot.gastos, alvo.id);
  const porCategoria = agruparPorCampo(
    gastos.map((g) => ({
      etapa: g.etapa,
      categoria: g.categoria,
      valor_total: g.valor_total,
    })),
    "categoria"
  );

  const limite = alvo.orcamento_previsto * 0.2;
  const acima = porCategoria.filter((c) => c.total > limite);

  if (acima.length === 0) {
    return respostaBase(
      "categorias_acima",
      `Nenhuma categoria na obra **${alvo.nome}** ultrapassou 20% do orçamento total (${formatCurrency(alvo.orcamento_previsto)}).`
    );
  }

  return respostaBase(
    "categorias_acima",
    `Categorias acima de 20% do orçamento em **${alvo.nome}**:\n${acima.map((c) => `• **${c.label}**: ${formatCurrency(c.total)} (${c.percentual}% do gasto)`).join("\n")}`,
    {
      indicadores: acima.map((c) => ({
        tipo: "atencao" as const,
        titulo: c.label,
        mensagem: `${formatCurrency(c.total)} — ${Math.round((c.total / alvo.orcamento_previsto) * 100)}% do orçamento`,
      })),
      graficos: [
        {
          tipo: "pie",
          titulo: "Gastos por categoria",
          dados: porCategoria.slice(0, 8).map((c) => ({
            label: c.label,
            valor: c.total,
            percentual: c.percentual,
          })),
        },
      ],
    }
  );
}

export function responderResumoFinanceiro(
  snapshot: SnapshotEngenheiroCedro
): RespostaEngenheiroCedro {
  const { gastoGeral, recebidoGeral, lucroGeral, orcamentoGeral } =
    snapshot.totais;
  const obrasAtivas = snapshot.obras.filter((o) => o.status === "Em andamento");
  const notasPendentes = snapshot.notas.filter((n) =>
    ["revisar", "processando", "pendente_aprovacao"].includes(n.status_processamento)
  );

  return respostaBase(
    "resumo_financeiro",
    `**Resumo financeiro Cedro Obras**\n• ${snapshot.obras.length} obra(s) — ${obrasAtivas.length} em andamento\n• Orçamento total: ${formatCurrency(orcamentoGeral)}\n• Gasto realizado: ${formatCurrency(gastoGeral)}\n• Valor recebido: ${formatCurrency(recebidoGeral)}\n• Lucro estimado: ${formatCurrency(lucroGeral)}\n• ${snapshot.gastos.length} lançamento(s) de gastos\n• ${notasPendentes.length} nota(s) pendente(s) de revisão`,
    {
      indicadores: [
        {
          tipo: lucroGeral >= 0 ? "sucesso" : "alerta",
          titulo: "Lucro geral",
          mensagem: formatCurrency(lucroGeral),
        },
        ...(notasPendentes.length > 0
          ? [
              {
                tipo: "atencao" as const,
                titulo: "Notas pendentes",
                mensagem: `${notasPendentes.length} nota(s) aguardando revisão`,
              },
            ]
          : []),
      ],
    }
  );
}

export function gerarIndicadoresAutomaticos(
  snapshot: SnapshotEngenheiroCedro,
  obra: ObraResumo | null
): IndicadorAssistente[] {
  const indicadores: IndicadorAssistente[] = [];
  const alvos = obra ? [obra] : snapshot.obras;

  for (const o of alvos) {
    if (o.orcamento_previsto > 0) {
      const pct = Math.round((o.gasto_realizado / o.orcamento_previsto) * 100);
      if (pct >= 92 && pct < 100) {
        indicadores.push({
          tipo: "atencao",
          titulo: o.nome,
          mensagem: `Os gastos ultrapassaram ${pct}% do orçamento.`,
        });
      }
      if (pct >= 100) {
        indicadores.push({
          tipo: "alerta",
          titulo: o.nome,
          mensagem: `Orçamento estourado (${pct}% do previsto).`,
        });
      }
    }
    if (o.lucro_estimado < 0) {
      indicadores.push({
        tipo: "alerta",
        titulo: o.nome,
        mensagem: `Lucro negativo: ${formatCurrency(o.lucro_estimado)}.`,
      });
    }
  }

  return indicadores.slice(0, 5);
}

// Re-export calcularLucro for comparisons
export { calcularLucro };
