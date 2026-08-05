"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  criarObraAdminAction,
  type AdminActionState,
} from "@/app/actions/obras-admin";
import { formatCurrency, parseNumber } from "@/lib/format";
import {
  btnPrimarySmClassName,
  btnSecondaryClassName,
  cardClassName,
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";

type Cliente = {
  id: string;
  nome: string;
};

const STATUS_OPTIONS = [
  "Planejamento",
  "Em andamento",
  "Pausada",
  "Concluída",
  "Cancelada",
];

type ObraFormProps = {
  clientes: Cliente[];
};

export default function ObraForm({ clientes }: ObraFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, startTransition] = useTransition();

  const [clienteId, setClienteId] = useState("");
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [orcamentoPrevisto, setOrcamentoPrevisto] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [gastoRealizado, setGastoRealizado] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataPrevistaTermino, setDataPrevistaTermino] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const lucroEstimado = useMemo(() => {
    return parseNumber(valorRecebido) - parseNumber(gastoRealizado);
  }, [valorRecebido, gastoRealizado]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("clienteId", clienteId);
    formData.set("nome", nome);
    formData.set("status", status);
    formData.set("orcamentoPrevisto", orcamentoPrevisto);
    formData.set("valorRecebido", valorRecebido);
    formData.set("gastoRealizado", gastoRealizado);
    formData.set("dataInicio", dataInicio);
    formData.set("dataPrevistaTermino", dataPrevistaTermino);
    formData.set("areaM2", areaM2);
    formData.set("observacoes", observacoes);

    startTransition(async () => {
      const result: AdminActionState = await criarObraAdminAction({}, formData);
      setLoading(false);

      if (result.erro) {
        setError(result.erro);
        return;
      }

      setSuccess(result.sucesso ?? "Obra cadastrada com sucesso");
      setTimeout(() => router.push("/obras"), 1500);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${cardClassName} p-6 sm:p-8`}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="cliente" className={labelClassName}>
            Cliente
          </label>
          <select
            id="cliente"
            required
            disabled={clientes.length === 0}
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
            className={selectClassName}
          >
            <option value="">
              {clientes.length === 0 ? "Nenhum cliente cadastrado" : "Selecione um cliente"}
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="nome" className={labelClassName}>
            Nome da obra
          </label>
          <input
            id="nome"
            type="text"
            required
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Reforma apartamento 302"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={labelClassName}>
            Status
          </label>
          <select
            id="status"
            required
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={selectClassName}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="area" className={labelClassName}>
            Área em m²
          </label>
          <input
            id="area"
            type="number"
            min="0"
            step="0.01"
            value={areaM2}
            onChange={(event) => setAreaM2(event.target.value)}
            placeholder="0,00"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="orcamento" className={labelClassName}>
            Orçamento previsto
          </label>
          <input
            id="orcamento"
            type="number"
            min="0"
            step="0.01"
            value={orcamentoPrevisto}
            onChange={(event) => setOrcamentoPrevisto(event.target.value)}
            placeholder="0,00"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="valor-recebido" className={labelClassName}>
            Valor recebido
          </label>
          <input
            id="valor-recebido"
            type="number"
            min="0"
            step="0.01"
            value={valorRecebido}
            onChange={(event) => setValorRecebido(event.target.value)}
            placeholder="0,00"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gasto-realizado" className={labelClassName}>
            Gasto realizado
          </label>
          <input
            id="gasto-realizado"
            type="number"
            min="0"
            step="0.01"
            value={gastoRealizado}
            onChange={(event) => setGastoRealizado(event.target.value)}
            placeholder="0,00"
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lucro-estimado" className={labelClassName}>
            Lucro estimado
          </label>
          <div
            id="lucro-estimado"
            className={`flex min-h-[42px] items-center rounded-lg border px-3 py-2.5 text-sm font-medium ${
              lucroEstimado >= 0
                ? "border-[var(--cedro-success)]/12 bg-[var(--cedro-success-bg)] text-[var(--cedro-success)]"
                : "border-[var(--cedro-error)]/12 bg-[var(--cedro-error-bg)] text-[var(--cedro-error)]"
            }`}
          >
            {formatCurrency(lucroEstimado)}
          </div>
          <p className="text-xs text-[var(--cedro-text-muted)]">
            Calculado automaticamente: valor recebido − gasto realizado
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="data-inicio" className={labelClassName}>
            Data de início
          </label>
          <input
            id="data-inicio"
            type="date"
            value={dataInicio}
            onChange={(event) => setDataInicio(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="data-termino" className={labelClassName}>
            Data prevista de término
          </label>
          <input
            id="data-termino"
            type="date"
            value={dataPrevistaTermino}
            onChange={(event) => setDataPrevistaTermino(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="observacoes" className={labelClassName}>
            Observações
          </label>
          <textarea
            id="observacoes"
            rows={4}
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            placeholder="Informações adicionais sobre a obra..."
            className={`${inputClassName} resize-y`}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--cedro-border)] pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/obras")}
          className={btnSecondaryClassName}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || clientes.length === 0}
          className={btnPrimarySmClassName}
        >
          {loading ? "Cadastrando..." : "Cadastrar Obra"}
        </button>
      </div>

      {success && (
        <p className="mt-4 text-sm text-[var(--cedro-success)]">
          {success}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-[var(--cedro-error)]">{error}</p>
      )}
    </form>
  );
}
