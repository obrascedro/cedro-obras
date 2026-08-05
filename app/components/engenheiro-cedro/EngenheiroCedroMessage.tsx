"use client";

import type { MensagemAssistente } from "@/lib/engenheiro-cedro-types";
import EngenheiroCedroChart from "@/app/components/engenheiro-cedro/EngenheiroCedroChart";
import EngenheiroCedroIndicadores from "@/app/components/engenheiro-cedro/EngenheiroCedroIndicadores";

function formatarTexto(conteudo: string) {
  const partes = conteudo.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {parte.slice(2, -2)}
        </strong>
      );
    }
    return parte.split("\n").map((linha, j, arr) => (
      <span key={`${i}-${j}`}>
        {linha}
        {j < arr.length - 1 ? <br /> : null}
      </span>
    ));
  });
}

type EngenheiroCedroMessageProps = {
  mensagem: MensagemAssistente;
};

export default function EngenheiroCedroMessage({
  mensagem,
}: EngenheiroCedroMessageProps) {
  const isUser = mensagem.role === "user";
  const metadados = mensagem.metadados;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
      >
        {!isUser ? (
          <p className="mb-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Engenheiro Cedro
          </p>
        ) : null}
        <div>{formatarTexto(mensagem.conteudo)}</div>

        {!isUser && metadados?.indicadores ? (
          <EngenheiroCedroIndicadores indicadores={metadados.indicadores} />
        ) : null}

        {!isUser && metadados?.graficos
          ? metadados.graficos.map((grafico, i) => (
              <EngenheiroCedroChart key={i} grafico={grafico} />
            ))
          : null}

        {!isUser && metadados?.fonte ? (
          <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
            Fonte: {metadados.fonte === "dados" ? "dados do sistema" : metadados.fonte === "ia" ? "análise IA" : "dados + IA"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
