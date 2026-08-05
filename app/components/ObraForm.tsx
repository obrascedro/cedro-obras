"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatCurrency, parseNumber } from "@/lib/format";
import {
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
const TIPO_OBRA_OPTIONS = [
  { value: "cliente", label: "Obra de cliente" },
  { value: "reforma_para_venda", label: "Reforma para venda" },
  { value: "reforma_para_aluguel", label: "Reforma para aluguel" },
  { value: "obra_propria", label: "Obra própria" },
  { value: "investimento", label: "Investimento" },
];

export default function ObraForm() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clientesError, setClientesError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tipoObra, setTipoObra] = useState("cliente");

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

  useEffect(() => {
    async function loadClientes() {
      const { data, error: fetchError } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome", { ascending: true });

      if (fetchError) {
        setClientesError(fetchError.message);
      } else {
        setClientes(data ?? []);
      }

      setLoadingClientes(false);
    }

    loadClientes();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { error: insertError } = await supabase.from("obras").insert({
      cliente_id: clienteId,
      nome,
      status,
      orcamento_previsto: parseNumber(orcamentoPrevisto),
      valor_recebido: parseNumber(valorRecebido),
      gasto_realizado: parseNumber(gastoRealizado),
      lucro_estimado: lucroEstimado,
      data_inicio: dataInicio || null,
      data_previsao_termino: dataPrevistaTermino || null,
      area_m2: parseNumber(areaM2),
      observacoes: observacoes.trim() || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess("Obra cadastrada com sucesso");
    setTimeout(() => router.push("/obras"), 1500);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="cliente" className={labelClassName}>
            Cliente
          </label>
          <select
            id="cliente"
            required
            disabled={loadingClientes}
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
            className={selectClassName}
          >
            <option value="">
              {loadingClientes ? "Carregando clientes..." : "Selecione um cliente"}
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
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            {formatCurrency(lucroEstimado)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
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

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:justify-end dark:border-zinc-800">
        <button
          type="button"
          onClick={() => router.push("/obras")}
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || loadingClientes}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Cadastrando..." : "Cadastrar Obra"}
        </button>
      </div>

      {clientesError && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          Erro ao carregar clientes: {clientesError}
        </p>
      )}

      {success && (
        <p className="mt-4 text-sm text-green-600 dark:text-green-400">
          {success}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
