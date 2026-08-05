/**
 * @deprecated Use aprovarNotaFiscalServer via app/actions/notas-fiscais-aprovacao.ts
 * Mantido apenas para compatibilidade — aprovação deve ocorrer no servidor.
 */
import { supabase } from "@/lib/supabase";
import { aprovarNotaFiscalServer } from "@/lib/aprovar-nota-fiscal";
import type { NotaFiscalItemExtraido } from "@/lib/nota-fiscal-ia";

type ConfirmarNotaFiscalParams = {
  notaId: string;
  obraId: string;
  fornecedor: string;
  cnpj: string;
  dataNota: string;
  valorTotal: number;
  observacoes?: string;
  itens: NotaFiscalItemExtraido[];
};

export async function confirmarNotaFiscalLeitura(params: ConfirmarNotaFiscalParams) {
  return aprovarNotaFiscalServer(supabase, {
    ...params,
    aprovadorNome: "Sistema (legado)",
  });
}
