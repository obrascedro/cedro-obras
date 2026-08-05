"use client";

import {
  inputClassName,
  labelClassName,
  selectClassName,
} from "@/app/components/ui/form-styles";
import type { ObraOption } from "@/lib/notas-fiscais";

type NotaFiscalCamposFormProps = {
  obras: ObraOption[];
  obraId: string;
  onObraIdChange: (value: string) => void;
  dataNota: string;
  onDataNotaChange: (value: string) => void;
  fornecedor: string;
  onFornecedorChange: (value: string) => void;
  cnpj?: string;
  onCnpjChange?: (value: string) => void;
  valorInformado: string;
  onValorInformadoChange: (value: string) => void;
  observacoes: string;
  onObservacoesChange: (value: string) => void;
  obraRequired?: boolean;
  showCnpj?: boolean;
  readOnlyObra?: boolean;
};

export default function NotaFiscalCamposForm({
  obras,
  obraId,
  onObraIdChange,
  dataNota,
  onDataNotaChange,
  fornecedor,
  onFornecedorChange,
  cnpj = "",
  onCnpjChange,
  valorInformado,
  onValorInformadoChange,
  observacoes,
  onObservacoesChange,
  obraRequired = true,
  showCnpj = false,
  readOnlyObra = false,
}: NotaFiscalCamposFormProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label htmlFor="obra-nota" className={labelClassName}>
          Obra vinculada
        </label>
        <select
          id="obra-nota"
          required={obraRequired}
          disabled={readOnlyObra}
          value={obraId}
          onChange={(event) => onObraIdChange(event.target.value)}
          className={`${selectClassName} disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <option value="">Selecione uma obra</option>
          {obras.map((obra) => (
            <option key={obra.id} value={obra.id}>
              {obra.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="data-nota" className={labelClassName}>
          Data da nota
        </label>
        <input
          id="data-nota"
          type="date"
          value={dataNota}
          onChange={(event) => onDataNotaChange(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fornecedor-nota" className={labelClassName}>
          Fornecedor
        </label>
        <input
          id="fornecedor-nota"
          type="text"
          value={fornecedor}
          onChange={(event) => onFornecedorChange(event.target.value)}
          placeholder="Nome do fornecedor"
          className={inputClassName}
        />
      </div>

      {showCnpj ? (
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="cnpj-nota" className={labelClassName}>
            CNPJ
          </label>
          <input
            id="cnpj-nota"
            type="text"
            value={cnpj}
            onChange={(event) => onCnpjChange?.(event.target.value)}
            placeholder="00.000.000/0000-00"
            className={inputClassName}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="valor-nota" className={labelClassName}>
          Valor total
        </label>
        <input
          id="valor-nota"
          type="number"
          min="0"
          step="0.01"
          value={valorInformado}
          onChange={(event) => onValorInformadoChange(event.target.value)}
          placeholder="0,00"
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label htmlFor="observacoes-nota" className={labelClassName}>
          Observações
        </label>
        <textarea
          id="observacoes-nota"
          rows={3}
          value={observacoes}
          onChange={(event) => onObservacoesChange(event.target.value)}
          placeholder="Informações adicionais sobre a nota..."
          className={`${inputClassName} resize-y`}
        />
      </div>
    </div>
  );
}
