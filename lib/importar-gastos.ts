export type GastoImportPreview = {
  id: string;
  data_gasto: string;
  categoria: string;
  etapa: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor: string;
};

type BlockMapping = {
  dataCol: number;
  descCol: number;
  valorCol: number;
  categoria: string;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isBlank(value: unknown): boolean {
  return String(value ?? "").trim() === "";
}

export function parseBrazilianCurrency(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (!value) {
    return 0;
  }

  let cleaned = String(value).trim().replace(/R\$\s?/gi, "").trim();
  if (!cleaned) {
    return 0;
  }

  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseBrazilianDate(value: unknown): string | null {
  if (!value && value !== 0) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let index = 0; index < Math.min(rows.length, 30); index += 1) {
    const headers = rows[index].map(normalizeHeader);
    const hasData = headers.some(
      (header) => header === "DATA" || header === "DATA2" || header.startsWith("DATA")
    );
    const hasDescription = headers.some(
      (header) =>
        header.includes("DESCRIC") ||
        header.includes("MAO DE OBRA") ||
        header.includes("MÃO DE OBRA")
    );
    const hasValor = headers.some((header) => header === "VALOR");

    if (hasData && hasDescription && hasValor) {
      return index;
    }
  }

  return 0;
}

function mapBlocks(headers: unknown[]): BlockMapping[] {
  const normalized = headers.map(normalizeHeader);
  const valorCols = normalized
    .map((header, index) => (header === "VALOR" ? index : -1))
    .filter((index) => index >= 0);

  const blocks: BlockMapping[] = [];

  const dataCol = normalized.findIndex((header) => header === "DATA");
  const descCol = normalized.findIndex((header) => header.includes("DESCRIC"));

  if (dataCol >= 0 && descCol >= 0 && valorCols[0] !== undefined) {
    blocks.push({
      dataCol,
      descCol,
      valorCol: valorCols[0],
      categoria: "Material",
    });
  }

  const data2Col = normalized.findIndex(
    (header) => header === "DATA2" || header === "DATA 2"
  );
  const maoCol = normalized.findIndex(
    (header) => header.includes("MAO DE OBRA") || header.includes("MÃO DE OBRA")
  );

  if (maoCol >= 0 && valorCols[1] !== undefined) {
    blocks.push({
      dataCol: data2Col >= 0 ? data2Col : Math.max(maoCol - 1, 0),
      descCol: maoCol,
      valorCol: valorCols[1],
      categoria: "Mão de obra",
    });
  }

  return blocks;
}

function createPreviewRow(
  block: BlockMapping,
  row: unknown[]
): GastoImportPreview | null {
  const dataValue = row[block.dataCol];
  const descricao = String(row[block.descCol] ?? "").trim();
  const valorTotal = parseBrazilianCurrency(row[block.valorCol]);

  if (isBlank(dataValue) && isBlank(descricao) && valorTotal === 0) {
    return null;
  }

  if (isBlank(descricao) && valorTotal === 0) {
    return null;
  }

  const quantidade = 1;
  const dataGasto = parseBrazilianDate(dataValue);

  return {
    id: crypto.randomUUID(),
    data_gasto: dataGasto ?? "",
    categoria: block.categoria,
    etapa: "Não classificado",
    descricao,
    quantidade,
    valor_unitario: valorTotal,
    valor_total: valorTotal,
    fornecedor: "",
  };
}

export function parseSpreadsheetRows(rows: unknown[][]): GastoImportPreview[] {
  if (!rows.length) {
    return [];
  }

  const headerRowIndex = findHeaderRowIndex(rows);
  const headerRow = rows[headerRowIndex] ?? [];
  const blocks = mapBlocks(headerRow);

  if (!blocks.length) {
    throw new Error(
      "Não foi possível identificar as colunas da planilha. Verifique os cabeçalhos DATA, DESCRIÇÃO, VALOR, DATA2 e MÃO DE OBRA."
    );
  }

  const previewRows: GastoImportPreview[] = [];

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];

    for (const block of blocks) {
      const previewRow = createPreviewRow(block, row);
      if (previewRow) {
        previewRows.push(previewRow);
      }
    }
  }

  return previewRows;
}

export function isValidImportRow(row: GastoImportPreview): boolean {
  return (
    row.descricao.trim() !== "" &&
    row.valor_total > 0 &&
    row.data_gasto.trim() !== "" &&
    row.quantidade > 0
  );
}

export function syncRowValues(
  row: GastoImportPreview,
  field: keyof GastoImportPreview,
  value: string | number
): GastoImportPreview {
  const updated = { ...row, [field]: value };

  if (field === "quantidade" || field === "valor_unitario") {
    updated.valor_total = updated.quantidade * updated.valor_unitario;
  }

  if (field === "valor_total") {
    updated.valor_unitario =
      updated.quantidade > 0 ? updated.valor_total / updated.quantidade : 0;
  }

  if (field === "quantidade" && updated.quantidade === 1) {
    updated.valor_unitario = updated.valor_total;
  }

  return updated;
}

export function toSupabaseInsert(row: GastoImportPreview, obraId: string) {
  return {
    obra_id: obraId,
    etapa: row.etapa.trim() || "Não classificado",
    categoria: row.categoria.trim(),
    descricao: row.descricao.trim(),
    quantidade: row.quantidade,
    valor_unitario: row.valor_unitario,
    valor_total: row.valor_total,
    fornecedor: row.fornecedor.trim() || null,
    data_gasto: row.data_gasto,
  };
}
