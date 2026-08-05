import type { SupabaseClient } from "@supabase/supabase-js";
import { logNotaFiscal, logNotaFiscalError } from "@/lib/nota-fiscal-log";
import {
  gerarChaveClassificacao,
  normalizarTermoClassificacao,
} from "@/lib/nota-fiscal-catalogo";
import {
  normalizarCategoria,
  normalizarEtapa,
} from "@/lib/nota-fiscal-normalizacao";
import type {
  CategoriaNotaFiscal,
  EtapaNotaFiscal,
} from "@/lib/nota-fiscal-constants";

export type ClassificacaoAprendida = {
  termo_chave: string;
  descricao_exemplo: string;
  categoria: CategoriaNotaFiscal;
  etapa: EtapaNotaFiscal;
  uso_count: number;
};

const TABELA = "classificacoes_aprendidas";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cacheAprendidas: Map<string, ClassificacaoAprendida> | null = null;
let cacheExpiraEm = 0;

function invalidarCacheAprendidas() {
  cacheAprendidas = null;
  cacheExpiraEm = 0;
}

export async function carregarClassificacoesAprendidas(
  client: SupabaseClient,
  opcoes?: { forcarRecarga?: boolean }
): Promise<Map<string, ClassificacaoAprendida>> {
  const agora = Date.now();

  if (
    !opcoes?.forcarRecarga &&
    cacheAprendidas &&
    agora < cacheExpiraEm
  ) {
    logNotaFiscal("aprendizado.carregar.cache", { total: cacheAprendidas.size });
    return cacheAprendidas;
  }

  const mapa = new Map<string, ClassificacaoAprendida>();

  const { data, error } = await client
    .from(TABELA)
    .select("termo_chave, descricao_exemplo, categoria, etapa, uso_count")
    .order("uso_count", { ascending: false });

  if (error) {
    logNotaFiscalError("aprendizado.carregar.erro", error);
    return mapa;
  }

  for (const row of data ?? []) {
    mapa.set(row.termo_chave, {
      termo_chave: row.termo_chave,
      descricao_exemplo: row.descricao_exemplo,
      categoria: normalizarCategoria(row.categoria),
      etapa: normalizarEtapa(row.etapa),
      uso_count: row.uso_count ?? 1,
    });
  }

  logNotaFiscal("aprendizado.carregar.sucesso", { total: mapa.size });
  cacheAprendidas = mapa;
  cacheExpiraEm = Date.now() + CACHE_TTL_MS;
  return mapa;
}

export function buscarClassificacaoAprendida(
  descricao: string,
  aprendidas: Map<string, ClassificacaoAprendida>
): ClassificacaoAprendida | null {
  const chave = gerarChaveClassificacao(descricao);
  if (!chave) return null;

  const exata = aprendidas.get(chave);
  if (exata) return exata;

  const texto = normalizarTermoClassificacao(descricao);

  for (const [termoChave, registro] of aprendidas) {
    if (texto.includes(termoChave) || termoChave.includes(chave)) {
      return registro;
    }
  }

  return null;
}

export async function salvarClassificacaoAprendida(
  descricao: string,
  categoria: string,
  etapa: string,
  client: SupabaseClient
): Promise<void> {
  const termoChave = gerarChaveClassificacao(descricao);
  if (!termoChave || !descricao.trim()) return;

  const categoriaNorm = normalizarCategoria(categoria);
  const etapaNorm = normalizarEtapa(etapa);

  logNotaFiscal("aprendizado.salvar.inicio", {
    termoChave,
    categoria: categoriaNorm,
    etapa: etapaNorm,
  });

  const { data: existente } = await client
    .from(TABELA)
    .select("id, uso_count")
    .eq("termo_chave", termoChave)
    .maybeSingle();

  if (existente) {
    const { error } = await client
      .from(TABELA)
      .update({
        descricao_exemplo: descricao.trim(),
        categoria: categoriaNorm,
        etapa: etapaNorm,
        uso_count: (existente.uso_count ?? 1) + 1,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", existente.id);

    if (error) {
      logNotaFiscalError("aprendizado.salvar.update.erro", error, { termoChave });
      throw error;
    }
  } else {
    const { error } = await client.from(TABELA).insert({
      termo_chave: termoChave,
      descricao_exemplo: descricao.trim(),
      categoria: categoriaNorm,
      etapa: etapaNorm,
      origem: "usuario",
      uso_count: 1,
    });

    if (error) {
      logNotaFiscalError("aprendizado.salvar.insert.erro", error, { termoChave });
      throw error;
    }
  }

  logNotaFiscal("aprendizado.salvar.sucesso", { termoChave });
  invalidarCacheAprendidas();
}
