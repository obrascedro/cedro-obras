"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  importarGastosObraAdminAction,
  type GastoImportRow,
} from "@/app/actions/gastos-admin";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  type GastoImportPreview,
  isValidImportRow,
  parseSpreadsheetRows,
  syncRowValues,
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

    const linhas: GastoImportRow[] = validRows.map((row) => ({
      etapa: row.etapa,
      categoria: row.categoria,
      descricao: row.descricao,
      fornecedor: row.fornecedor.trim() || null,
      quantidade: row.quantidade,
      valor_unitario: row.valor_unitario,
      valor_total: row.valor_total,
      data_gasto: row.data_gasto || null,
    }));

    const result = await importarGastosObraAdminAction(obraId, linhas);
    setLoading(false);

    if (result.erro) {
      setImportError(result.erro);
      return;
    }

    setImportSummary(result.sucesso ?? `${validRows.length} linha(s) importada(s).`);
    router.push(`/obras/${obraId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="cedro-card p-6">
        <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
          Selecionar planilha
        </h2>
        <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
          Envie um arquivo .xlsx ou .csv com colunas de materiais e mão de obra.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-[var(--cedro-text-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--cedro-brown)] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--cedro-brown-hover)]"
          />
          {fileName ? (
            <span className="text-sm text-[var(--cedro-text-muted)]">{fileName}</span>
          ) : null}
        </div>

        {parsing ? (
          <p className="mt-4 text-sm text-[var(--cedro-text-muted)]">
            Lendo planilha...
          </p>
        ) : null}

        {parseError ? (
          <p className="mt-4 text-sm text-[var(--cedro-error)]">{parseError}</p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="cedro-card p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
                Prévia da importação
              </h2>
              <p className="text-sm text-[var(--cedro-text-muted)]">
                {rows.length} linha(s) encontrada(s). Revise, edite ou exclua antes de importar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="cedro-btn-primary px-4 py-2.5 text-sm"
            >
              {loading ? "Importando..." : "Importar"}
            </button>
          </div>

          <div className="cedro-table-wrap">
            <table className="cedro-table">
              <thead>
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
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
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
                        <p className="mt-1 text-xs text-[var(--cedro-text-muted)]">
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
                      <p className="mt-1 text-xs text-[var(--cedro-text-muted)]">
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
                        className="text-sm font-medium text-[var(--cedro-error)] transition-colors hover:text-[var(--cedro-brown-dark)]"
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
            <p className="mt-4 text-sm text-[var(--cedro-error)]">{importError}</p>
          ) : null}

          {importSummary ? (
            <p className="mt-4 text-sm text-[var(--cedro-success)]">
              {importSummary}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
