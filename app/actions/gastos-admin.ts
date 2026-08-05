"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { parseNumber } from "@/lib/format";
import { recalcularFinanceiroObra } from "@/lib/obra-financeiro";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { AdminActionState } from "@/app/actions/obras-admin";

function revalidarObraGastos(obraId: string) {
  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/dashboard");
  revalidatePath("/obras");
}

export async function criarGastoObraAdminAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const obraId = String(formData.get("obraId") ?? "").trim();
    const etapa = String(formData.get("etapa") ?? "").trim();
    const categoria = String(formData.get("categoria") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();
    const fornecedor = String(formData.get("fornecedor") ?? "").trim();
    const quantidade = parseNumber(String(formData.get("quantidade") ?? ""));
    const valorUnitario = parseNumber(String(formData.get("valorUnitario") ?? ""));
    const dataGasto = String(formData.get("dataGasto") ?? "").trim();
    const valorTotal = quantidade * valorUnitario;

    if (!obraId || !etapa || !categoria || !descricao) {
      return { erro: "Preencha os campos obrigatórios." };
    }

    const { error } = await supabase.from("gastos_obra").insert({
      obra_id: obraId,
      etapa,
      categoria,
      descricao,
      fornecedor: fornecedor || null,
      quantidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      data_gasto: dataGasto || null,
      origem: "manual",
      ativo: true,
    });

    if (error) return { erro: error.message };

    await recalcularFinanceiroObra(obraId, supabase);

    revalidarObraGastos(obraId);
    return { sucesso: "Gasto cadastrado com sucesso" };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao cadastrar gasto.",
    };
  }
}

export type GastoImportRow = {
  etapa: string;
  categoria: string;
  descricao: string;
  fornecedor: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  data_gasto: string | null;
};

export async function importarGastosObraAdminAction(
  obraId: string,
  linhas: GastoImportRow[]
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    if (!obraId || linhas.length === 0) {
      return { erro: "Nenhuma linha válida para importar." };
    }

    const payload = linhas.map((row) => ({
      obra_id: obraId,
      etapa: row.etapa,
      categoria: row.categoria,
      descricao: row.descricao,
      fornecedor: row.fornecedor,
      quantidade: row.quantidade,
      valor_unitario: row.valor_unitario,
      valor_total: row.valor_total,
      data_gasto: row.data_gasto,
      origem: "manual",
      ativo: true,
    }));

    const { error } = await supabase.from("gastos_obra").insert(payload);
    if (error) return { erro: error.message };

    await recalcularFinanceiroObra(obraId, supabase);

    revalidarObraGastos(obraId);
    return { sucesso: `${linhas.length} linha(s) importada(s) com sucesso.` };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao importar gastos.",
    };
  }
}

export async function atualizarGastoObraAdminAction(
  gastoId: string,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const etapa = String(formData.get("etapa") ?? "").trim();
    const categoria = String(formData.get("categoria") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();
    const fornecedor = String(formData.get("fornecedor") ?? "").trim();
    const quantidade = parseNumber(String(formData.get("quantidade") ?? ""));
    const valorUnitario = parseNumber(String(formData.get("valorUnitario") ?? ""));
    const dataGasto = String(formData.get("dataGasto") ?? "").trim();
    const valorTotal = Math.round(quantidade * valorUnitario * 100) / 100;

    if (!gastoId) return { erro: "Gasto não informado." };
    if (!etapa || !categoria || !descricao) {
      return { erro: "Preencha os campos obrigatórios." };
    }
    if (valorTotal < 0) return { erro: "Valor não pode ser negativo." };

    const { data: atual } = await supabase
      .from("gastos_obra")
      .select("id, obra_id, ativo")
      .eq("id", gastoId)
      .maybeSingle();

    if (!atual || atual.ativo === false) {
      return { erro: "Gasto não encontrado." };
    }

    const { error } = await supabase
      .from("gastos_obra")
      .update({
        etapa,
        categoria,
        descricao,
        fornecedor: fornecedor || null,
        quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorTotal,
        data_gasto: dataGasto || null,
      })
      .eq("id", gastoId);

    if (error) return { erro: error.message };

    await recalcularFinanceiroObra(String(atual.obra_id), supabase);
    revalidarObraGastos(String(atual.obra_id));
    return { sucesso: "Gasto atualizado com sucesso." };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao atualizar gasto.",
    };
  }
}

export async function excluirGastoObraAdminAction(
  gastoId: string
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const { data: atual } = await supabase
      .from("gastos_obra")
      .select("id, obra_id, ativo")
      .eq("id", gastoId)
      .maybeSingle();

    if (!atual || atual.ativo === false) {
      return { erro: "Gasto não encontrado." };
    }

    const { error } = await supabase
      .from("gastos_obra")
      .update({ ativo: false })
      .eq("id", gastoId);

    if (error) return { erro: error.message };

    await recalcularFinanceiroObra(String(atual.obra_id), supabase);
    revalidarObraGastos(String(atual.obra_id));
    return { sucesso: "Gasto excluído." };
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : "Erro ao excluir gasto.",
    };
  }
}

export async function contarNotasPendentesAdminAction(): Promise<number> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("notas_fiscais")
    .select("*", { count: "exact", head: true })
    .in("status_processamento", ["pendente_aprovacao", "revisar"]);

  if (error) return 0;
  return count ?? 0;
}
