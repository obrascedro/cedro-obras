export const ETAPA_OUTRO = "Outro" as const;

export const ETAPAS_OBRA = [
  "Preparação do terreno",
  "Fundação",
  "Estrutura",
  "Alvenaria",
  "Cobertura",
  "Instalações elétricas",
  "Instalações hidráulicas",
  "Revestimentos",
  "Pintura",
  "Acabamentos",
  "Área externa",
  "Limpeza final",
  "Entrega",
  ETAPA_OUTRO,
] as const;

export type EtapaObra = (typeof ETAPAS_OBRA)[number];

export function isEtapaObraValida(valor: string): valor is EtapaObra {
  return (ETAPAS_OBRA as readonly string[]).includes(valor);
}

export function rotuloEtapa(etapa: string, etapaOutro?: string | null): string {
  if (etapa === ETAPA_OUTRO && etapaOutro?.trim()) {
    return etapaOutro.trim();
  }
  return etapa;
}
