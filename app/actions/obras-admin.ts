"use server";

import { revalidatePath } from "next/cache";
import { auditarObraAlterada, auditarRecebimentoObra } from "@/lib/audit-helpers";
import { requireAdminSession } from "@/lib/auth";
import { parseMoedaBr } from "@/lib/moeda-br";
import { sincronizarFinanceiroObra } from "@/lib/obra-financeiro";
import { listarRecebimentosObra, type ObraRecebimento } from "@/lib/obra-recebimentos";
import { isStatusObraValido } from "@/lib/obras-constants";
import { parseNumber } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type AdminActionState = {
  erro?: string;
  sucesso?: string;
};

export async function listarClientesObraAdminAction(): Promise<
  { id: string; nome: string }[]
> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .order("nome");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarObraAdminAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const clienteId = String(formData.get("clienteId") ?? "").trim();
    const nome = String(formData.get("nome") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const orcamentoPrevisto = parseNumber(
      String(formData.get("orcamentoPrevisto") ?? "")
    );
    const valorRecebido = parseNumber(String(formData.get("valorRecebido") ?? ""));
    const gastoRealizado = parseNumber(String(formData.get("gastoRealizado") ?? ""));
    const dataInicio = String(formData.get("dataInicio") ?? "").trim();
    const dataPrevistaTermino = String(
      formData.get("dataPrevistaTermino") ?? ""
    ).trim();
    const areaM2 = parseNumber(String(formData.get("areaM2") ?? ""));
    const observacoes = String(formData.get("observacoes") ?? "").trim();

    if (!clienteId || !nome) {
      return { erro: "Informe cliente e nome da obra." };
    }

    const lucroEstimado = valorRecebido - gastoRealizado;

    const { error } = await supabase.from("obras").insert({
      cliente_id: clienteId,
      nome,
      status: status || "Planejamento",
      orcamento_previsto: orcamentoPrevisto,
      valor_recebido: valorRecebido,
      gasto_realizado: gastoRealizado,
      lucro_estimado: lucroEstimado,
      data_inicio: dataInicio || null,
      data_previsao_termino: dataPrevistaTermino || null,
      area_m2: areaM2,
      observacoes: observacoes || null,
    });

    if (error) return { erro: error.message };

    revalidatePath("/obras");
    revalidatePath("/dashboard");
    return { sucesso: "Obra cadastrada com sucesso." };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao cadastrar obra.",
    };
  }
}

type ObraEditavelSnapshot = {
  nome: string;
  cliente_id: string;
  status: string;
  orcamento_previsto: number | null;
  data_inicio: string | null;
  data_previsao_termino: string | null;
  area_m2: number | null;
  observacoes: string | null;
};

function revalidarObra(obraId: string) {
  revalidatePath("/obras");
  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/dashboard");
}

export async function atualizarObraAdminAction(
  obraId: string,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const session = await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const clienteId = String(formData.get("clienteId") ?? "").trim();
    const nome = String(formData.get("nome") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const orcamentoPrevisto = parseMoedaBr(
      String(formData.get("orcamentoPrevisto") ?? "")
    );
    const dataInicio = String(formData.get("dataInicio") ?? "").trim();
    const dataPrevistaTermino = String(
      formData.get("dataPrevistaTermino") ?? ""
    ).trim();
    const areaRaw = String(formData.get("areaM2") ?? "").trim();
    const areaM2 = areaRaw ? parseNumber(areaRaw.replace(",", ".")) : null;
    const observacoes = String(formData.get("observacoes") ?? "").trim();

    if (!obraId) return { erro: "Obra não informada." };
    if (!clienteId || !nome) return { erro: "Informe cliente e nome da obra." };
    if (!isStatusObraValido(status)) return { erro: "Status inválido." };
    if (orcamentoPrevisto < 0) {
      return { erro: "Orçamento previsto não pode ser negativo." };
    }

    const { data: obraAtual, error: fetchError } = await supabase
      .from("obras")
      .select(
        "id, nome, cliente_id, status, orcamento_previsto, data_inicio, data_previsao_termino, area_m2, observacoes"
      )
      .eq("id", obraId)
      .maybeSingle();

    if (fetchError || !obraAtual) {
      return { erro: "Obra não encontrada." };
    }

    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", clienteId)
      .maybeSingle();

    if (!cliente) return { erro: "Cliente não encontrado." };

    const depois: ObraEditavelSnapshot = {
      nome,
      cliente_id: clienteId,
      status,
      orcamento_previsto: orcamentoPrevisto,
      data_inicio: dataInicio || null,
      data_previsao_termino: dataPrevistaTermino || null,
      area_m2: areaM2,
      observacoes: observacoes || null,
    };

    const { error: updateError } = await supabase
      .from("obras")
      .update({
        cliente_id: depois.cliente_id,
        nome: depois.nome,
        status: depois.status,
        orcamento_previsto: depois.orcamento_previsto,
        data_inicio: depois.data_inicio,
        data_previsao_termino: depois.data_previsao_termino,
        area_m2: depois.area_m2,
        observacoes: depois.observacoes,
      })
      .eq("id", obraId);

    if (updateError) return { erro: updateError.message };

    await auditarObraAlterada(session, {
      obraId,
      obraNome: depois.nome,
      antes: obraAtual as ObraEditavelSnapshot,
      depois,
    });

    revalidarObra(obraId);
    return { sucesso: "Obra atualizada com sucesso." };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao atualizar obra.",
    };
  }
}

export async function listarRecebimentosObraAdminAction(
  obraId: string
): Promise<ObraRecebimento[]> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  return listarRecebimentosObra(supabase, obraId);
}

export async function criarRecebimentoObraAdminAction(
  obraId: string,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const session = await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const valor = parseMoedaBr(String(formData.get("valor") ?? ""));
    const dataRecebimento = String(formData.get("dataRecebimento") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();

    if (!obraId) return { erro: "Obra não informada." };
    if (valor <= 0) return { erro: "Informe um valor maior que zero." };
    if (!dataRecebimento) return { erro: "Informe a data do recebimento." };

    const { data: obra } = await supabase
      .from("obras")
      .select("id, nome")
      .eq("id", obraId)
      .maybeSingle();

    if (!obra) return { erro: "Obra não encontrada." };

    const { data: inserted, error } = await supabase
      .from("obra_recebimentos")
      .insert({
        obra_id: obraId,
        valor,
        data_recebimento: dataRecebimento,
        descricao: descricao || null,
        origem: "manual",
        criado_por: session.userId,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return { erro: error?.message ?? "Não foi possível registrar o recebimento." };
    }

    await sincronizarFinanceiroObra(obraId, supabase);

    await auditarRecebimentoObra(session, {
      acao: "criacao",
      obraId,
      obraNome: obra.nome,
      recebimentoId: String(inserted.id),
      valor,
    });

    revalidarObra(obraId);
    return { sucesso: "Recebimento registrado." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao registrar recebimento.",
    };
  }
}

export async function atualizarRecebimentoObraAdminAction(
  recebimentoId: string,
  formData: FormData
): Promise<AdminActionState> {
  try {
    const session = await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const valor = parseMoedaBr(String(formData.get("valor") ?? ""));
    const dataRecebimento = String(formData.get("dataRecebimento") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();

    if (!recebimentoId) return { erro: "Recebimento não informado." };
    if (valor <= 0) return { erro: "Informe um valor maior que zero." };
    if (!dataRecebimento) return { erro: "Informe a data do recebimento." };

    const { data: atual } = await supabase
      .from("obra_recebimentos")
      .select("id, obra_id, valor, obras(nome)")
      .eq("id", recebimentoId)
      .maybeSingle();

    if (!atual) return { erro: "Recebimento não encontrado." };

    const obraNome = Array.isArray(atual.obras)
      ? atual.obras[0]?.nome
      : (atual.obras as { nome: string } | null)?.nome;

    const { error } = await supabase
      .from("obra_recebimentos")
      .update({
        valor,
        data_recebimento: dataRecebimento,
        descricao: descricao || null,
      })
      .eq("id", recebimentoId);

    if (error) return { erro: error.message };

    await sincronizarFinanceiroObra(String(atual.obra_id), supabase);

    await auditarRecebimentoObra(session, {
      acao: "edicao",
      obraId: String(atual.obra_id),
      obraNome: obraNome ?? "—",
      recebimentoId,
      valor,
      valorAnterior: Number(atual.valor),
    });

    revalidarObra(String(atual.obra_id));
    return { sucesso: "Recebimento atualizado." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao atualizar recebimento.",
    };
  }
}

export async function excluirRecebimentoObraAdminAction(
  recebimentoId: string
): Promise<AdminActionState> {
  try {
    const session = await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const { data: atual } = await supabase
      .from("obra_recebimentos")
      .select("id, obra_id, valor, obras(nome)")
      .eq("id", recebimentoId)
      .maybeSingle();

    if (!atual) return { erro: "Recebimento não encontrado." };

    const obraNome = Array.isArray(atual.obras)
      ? atual.obras[0]?.nome
      : (atual.obras as { nome: string } | null)?.nome;

    const { error } = await supabase
      .from("obra_recebimentos")
      .delete()
      .eq("id", recebimentoId);

    if (error) return { erro: error.message };

    await sincronizarFinanceiroObra(String(atual.obra_id), supabase);

    await auditarRecebimentoObra(session, {
      acao: "exclusao",
      obraId: String(atual.obra_id),
      obraNome: obraNome ?? "—",
      recebimentoId,
      valor: Number(atual.valor),
    });

    revalidarObra(String(atual.obra_id));
    return { sucesso: "Recebimento excluído." };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao excluir recebimento.",
    };
  }
}
