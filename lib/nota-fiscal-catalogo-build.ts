import type { EntradaCatalogoObra } from "@/lib/nota-fiscal-catalogo-data";

/** Expande entradas canônicas incluindo sinônimos como termos indexáveis. */
export function expandirCatalogoObra(
  entradas: EntradaCatalogoObra[]
): EntradaCatalogoObra[] {
  const resultado: EntradaCatalogoObra[] = [];

  for (const entrada of entradas) {
    resultado.push({
      termo: entrada.termo,
      categoria: entrada.categoria,
      etapa: entrada.etapa,
      unidade: entrada.unidade,
    });

    for (const sinonimo of entrada.sinonimos ?? []) {
      resultado.push({
        termo: sinonimo,
        categoria: entrada.categoria,
        etapa: entrada.etapa,
        unidade: entrada.unidade,
      });
    }
  }

  return resultado;
}
