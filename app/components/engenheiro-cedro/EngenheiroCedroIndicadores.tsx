import type { IndicadorAssistente } from "@/lib/engenheiro-cedro-types";

type EngenheiroCedroIndicadoresProps = {
  indicadores: IndicadorAssistente[];
};

const estilos: Record<IndicadorAssistente["tipo"], string> = {
  alerta:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  atencao:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  sucesso:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export default function EngenheiroCedroIndicadores({
  indicadores,
}: EngenheiroCedroIndicadoresProps) {
  if (indicadores.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {indicadores.map((ind, index) => (
        <div
          key={`${ind.titulo}-${index}`}
          className={`rounded-lg border px-3 py-2 text-sm ${estilos[ind.tipo]}`}
        >
          <p className="font-semibold">{ind.titulo}</p>
          <p className="mt-0.5 opacity-90">{ind.mensagem}</p>
        </div>
      ))}
    </div>
  );
}
