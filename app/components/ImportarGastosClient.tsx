"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { recalcularGastoRealizado } from "@/lib/gastos-obra";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  type GastoImportPreview,
  isValidImportRow,
  parseSpreadsheetRows,
  syncRowValues,
  toSupabaseInsert,
} from "@/lib/importar-gastos";
import { inputClassName } from "@/app/components/ui/form-styles";

type ImportarGastosClientProps = {
  obraId: string;
};

export default function ImportarGastosClient({ obraId }: ImportarGastosClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<GastoImportPreview[]>([]);
  const [parseError, setParseError] = useState("");
  const [importError, setImportError] = useState("");
  const [importSummary, setImportSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setParseError("");
    setImportError("");
    setImportSummary("");

    if (!file) {
      return;
    }

    setParsing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
        raw: false,
      });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("A planilha não possui abas.");
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      const parsedRows = parseSpreadsheetRows(rawRows);
      setRows(parsedRows);

      if (!parsedRows.length) {
        setParseError("Nenhuma linha válida encontrada na planilha.");
      }
    } catch (error) {
      setRows([]);
      setParseError(
        error instanceof Error ? error.message : "Erro ao ler a planilha."
      );
    } finally {
      setParsing(false);
    }
  }

  function updateRow(id: string, field: keyof GastoImportPreview, value: string) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== id) {
          return row;
        }

        if (field === "quantidade" || field === "valor_unitario" || field === "valor_total") {
          const numericValue = Number(value);
          return syncRowValues(row, field, Number.isFinite(numericValue) ? numericValue : 0);
        }

        return syncRowValues(row, field, value);
      })
    );
  }

  function removeRow(id: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
  }

  async function handleImport() {
    setImportError("");
    setImportSummary("");

    const validRows = rows.filter(isValidImportRow);

    if (!validRows.length) {
      setImportError("Nenhuma linha válida para importar.");
      return;
    }

    setLoading(true);

    const payload = validRows.map((row) => toSupabaseInsert(row, obraId));
    const { error } = await supabase.from("gastos_obra").insert(payload);

    if (error) {
      setLoading(false);
      setImportError(error.message);
      return;
    }

    try {
      await recalcularGastoRealizado(obraId);
    } catch (recalcError) {
      setLoading(false);
      setImportError(
        recalcError instanceof Error
          ? recalcError.message
          : "Erro ao atualizar o gasto realizado da obra."
      );
      return;
    }

    setLoading(false);
    setImportSummary(`${validRows.length} linha(s) importada(s) com sucesso.`);
    router.push(`/obras/${obraId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Selecionar planilha
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Envie um arquivo .xlsx ou .csv com colunas de materiais e mão de obra.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 dark:text-zinc-300 dark:file:bg-zinc-50 dark:file:text-zinc-900 dark:hover:file:bg-zinc-200"
          />
          {fileName ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{fileName}</span>
          ) : null}
        </div>

        {parsing ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Lendo planilha...
          </p>
        ) : null}

        {parseError ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{parseError}</p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Prévia da importação
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {rows.length} linha(s) encontrada(s). Revise, edite ou exclua antes de importar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Importando..." : "Importar"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  {[
                    "Data",
                    "Categoria",
                    "Etapa",
                    "Descrição",
                    "Qtd.",
                    "Unit.",
                    "Total",
                    "Fornecedor",
                    "",
                  ].map((header) => (
                    <th
                      key={header || "actions"}
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <input
                        type="date"
                        value={row.data_gasto}
                        onChange={(event) =>
                          updateRow(row.id, "data_gasto", event.target.value)
                        }
                        className={`${inputClassName} min-w-[140px]`}
                      />
                      {!row.data_gasto ? (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                          Data inválida
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(row.data_gasto)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.categoria}
                        onChange={(event) =>
                          updateRow(row.id, "categoria", event.target.value)
                        }
                        className={`${inputClassName} min-w-[120px]`}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.etapa}
                        onChange={(event) =>
                          updateRow(row.id, "etapa", event.target.value)
                        }
                        className={`${inputClassName} min-w-[140px]`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.descricao}
                        onChange={(event) =>
                          updateRow(row.id, "descricao", event.target.value)
                        }
                        className={`${inputClassName} min-w-[220px]`}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.quantidade}
                        onChange={(event) =>
                          updateRow(row.id, "quantidade", event.target.value)
                        }
                        className={`${inputClassName} min-w-[80px]`}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.valor_unitario}
                        onChange={(event) =>
                          updateRow(row.id, "valor_unitario", event.target.value)
                        }
                        className={`${inputClassName} min-w-[110px]`}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.valor_total}
                        onChange={(event) =>
                          updateRow(row.id, "valor_total", event.target.value)
                        }
                        className={`${inputClassName} min-w-[110px]`}
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatCurrency(row.valor_total)}
                      </p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={row.fornecedor}
                        onChange={(event) =>
                          updateRow(row.id, "fornecedor", event.target.value)
                        }
                        className={`${inputClassName} min-w-[140px]`}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importError ? (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{importError}</p>
          ) : null}

          {importSummary ? (
            <p className="mt-4 text-sm text-green-600 dark:text-green-400">
              {importSummary}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
