"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { enviarNotaParaAprovacaoAction } from "@/app/actions/notas-fiscais-aprovacao";
import {
  atualizarStatusNotaAdminAction,
  criarNotaProcessandoAdminAction,
  excluirNotaAdminAction,
  obterUrlArquivoNotaAdminAction,
  salvarNotaManualAdminAction,
  uploadArquivoNotaAdminAction,
} from "@/app/actions/notas-fiscais-admin";
import PendenciasAprovacao from "@/app/components/notas-fiscais/PendenciasAprovacao";
import NotaFiscalCamposForm from "@/app/components/notas-fiscais/NotaFiscalCamposForm";
import NotaFiscalLeituraPreview from "@/app/components/notas-fiscais/NotaFiscalLeituraPreview";
import NotaFiscalUploadZone from "@/app/components/notas-fiscais/NotaFiscalUploadZone";
import { formatCurrency, formatDate, parseNumber } from "@/lib/format";
import {
  criarItemVazio,
  syncItemTotal,
  type NotaFiscalItemExtraido,
  type NotaFiscalLeitura,
} from "@/lib/nota-fiscal-ia";
import type { AlertasLeitura } from "@/lib/nota-fiscal-validacao";
import {
  formatStatusLabel,
  formatOrigemNota,
  getObraNomeNota,
  isAcceptedFile,
  isImageType,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
  statusNotaBadgeClass,
  type NotaFiscal,
  type ObraOption,
} from "@/lib/notas-fiscais";

type NotasFiscaisClientProps = {
  obras: ObraOption[];
  notasIniciais: NotaFiscal[];
  adminNome: string;
};

export default function NotasFiscaisClient({
  obras,
  notasIniciais,
  adminNome,
}: NotasFiscaisClientProps) {
  const router = useRouter();
  const previewUrlRef = useRef<string | null>(null);
  const confirmandoRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iaLoading, setIaLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [obraId, setObraId] = useState("");
  const [dataNota, setDataNota] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [valorInformado, setValorInformado] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [notaIdIa, setNotaIdIa] = useState<string | null>(null);
  const [storagePathIa, setStoragePathIa] = useState<string | null>(null);
  const [itensLeitura, setItensLeitura] = useState<NotaFiscalItemExtraido[]>(
    []
  );
  const [iaReviewMode, setIaReviewMode] = useState(false);
  const [alertasLeitura, setAlertasLeitura] = useState<AlertasLeitura | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }

  function resetIaState() {
    setNotaIdIa(null);
    setStoragePathIa(null);
    setItensLeitura([]);
    setIaReviewMode(false);
    setAlertasLeitura(null);
  }

  function resetForm() {
    setSelectedFile(null);
    clearPreviewUrl();
    setObraId("");
    setDataNota("");
    setFornecedor("");
    setCnpj("");
    setValorInformado("");
    setObservacoes("");
    resetIaState();
  }

  function handleFileSelection(file: File | null) {
    setError("");
    setSuccess("");
    resetIaState();
    clearPreviewUrl();

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isAcceptedFile(file)) {
      setError("Formato não suportado. Use JPG, JPEG, PNG, WEBP ou PDF.");
      return;
    }

    if (file.size > NOTAS_FISCAIS_MAX_SIZE_BYTES) {
      setError("O arquivo excede o limite de 10 MB.");
      return;
    }

    if (isImageType(file.type)) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    }

    setSelectedFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files?.[0] ?? null);
  }

  async function uploadNotaParaStorage(): Promise<string | null> {
    if (!selectedFile || !obraId) {
      return null;
    }

    const formData = new FormData();
    formData.set("obraId", obraId);
    formData.set("arquivo", selectedFile);

    const result = await uploadArquivoNotaAdminAction(formData);
    if ("erro" in result) {
      throw new Error(result.erro);
    }
    return result.storagePath;
  }

  function aplicarLeituraNaInterface(
    leitura: NotaFiscalLeitura,
    alertas?: AlertasLeitura
  ) {
    setFornecedor(leitura.fornecedor);
    setCnpj(leitura.cnpj);
    setDataNota(leitura.data);
    setValorInformado(
      leitura.valor_total > 0 ? String(leitura.valor_total) : ""
    );
    setItensLeitura(leitura.itens);
    setAlertasLeitura(alertas ?? null);
    setIaReviewMode(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedFile) {
      setError("Selecione um arquivo para enviar.");
      return;
    }

    if (!obraId) {
      setError("Selecione a obra vinculada à nota.");
      return;
    }

    setLoading(true);

    let storagePath: string;

    try {
      storagePath = (await uploadNotaParaStorage())!;
    } catch (uploadError) {
      setLoading(false);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Erro ao enviar o arquivo."
      );
      return;
    }

    const salvar = await salvarNotaManualAdminAction({
      obraId,
      storagePath,
      fileName: selectedFile.name,
      mimeType: selectedFile.type || null,
      fileSize: selectedFile.size,
      fornecedor,
      dataNota,
      valorInformado,
      observacoes,
    });

    if ("erro" in salvar) {
      setLoading(false);
      setError(salvar.erro);
      return;
    }

    setLoading(false);
    setSuccess("Nota fiscal enviada com sucesso.");
    resetForm();
    router.refresh();
  }

  async function handleLerComIA() {
    setError("");
    setSuccess("");

    if (!selectedFile) {
      setError("Selecione um arquivo para ler com IA.");
      return;
    }

    if (!obraId) {
      setError("Selecione a obra vinculada à nota.");
      return;
    }

    setIaLoading(true);

    let storagePath = storagePathIa;
    let notaId = notaIdIa;

    try {
      if (!storagePath) {
        storagePath = (await uploadNotaParaStorage())!;
        setStoragePathIa(storagePath);
      }

      if (!notaId) {
        const criada = await criarNotaProcessandoAdminAction({
          obraId,
          storagePath,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || null,
          fileSize: selectedFile.size,
        });
        if ("erro" in criada) {
          throw new Error(criada.erro);
        }
        notaId = criada.notaId;
        setNotaIdIa(notaId);
      } else {
        const atualizado = await atualizarStatusNotaAdminAction(notaId, "processando");
        if ("erro" in atualizado) {
          throw new Error(atualizado.erro);
        }
      }

      const response = await fetch("/api/notas-fiscais/ler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath,
          mimeType: selectedFile.type || "application/octet-stream",
          fileName: selectedFile.name,
          notaId,
          observacoes,
          enviadoPorNome: adminNome,
        }),
      });

      let payload: {
        leitura?: NotaFiscalLeitura;
        alertas?: AlertasLeitura;
        error?: string;
      };

      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        throw new Error("Resposta inválida da API de leitura.");
      }

      if (!response.ok || !payload.leitura) {
        throw new Error(payload.error ?? "Erro ao ler a nota fiscal com IA.");
      }

      aplicarLeituraNaInterface(payload.leitura, payload.alertas);

      const mensagemAlertas = payload.alertas?.mensagens.length
        ? ` ${payload.alertas.mensagens[0]}`
        : "";

      setSuccess(
        `Leitura concluída. A nota foi enviada para aprovação.${mensagemAlertas}`
      );
      router.refresh();
    } catch (iaError) {
      setError(
        iaError instanceof Error
          ? iaError.message
          : "Erro ao processar a nota com IA."
      );
    } finally {
      setIaLoading(false);
    }
  }

  function registrarAprendizadoClassificacao(
    descricao: string,
    categoria: string,
    etapa: string
  ) {
    if (!descricao.trim()) return;

    void fetch("/api/notas-fiscais/aprender-classificacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, categoria, etapa }),
    }).catch(() => {
      // Falha silenciosa — não bloqueia o fluxo do usuário
    });
  }

  function handleItemChange(
    id: string,
    field: keyof NotaFiscalItemExtraido,
    value: string | number | boolean
  ) {
    setItensLeitura((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const updated = syncItemTotal(item, field, value);

        if (
          (field === "categoria" || field === "etapa") &&
          updated.descricao.trim()
        ) {
          registrarAprendizadoClassificacao(
            updated.descricao,
            updated.categoria,
            updated.etapa
          );
        }

        return updated;
      })
    );
  }

  function handleRemoveItem(id: string) {
    setItensLeitura((current) => current.filter((item) => item.id !== id));
  }

  function handleAddItem() {
    setItensLeitura((current) => [...current, criarItemVazio()]);
  }

  async function handleEnviarParaAprovacao() {
    if (!notaIdIa || !obraId) {
      setError("Não foi possível enviar: nota ou obra não identificada.");
      return;
    }

    if (confirmandoRef.current || confirmLoading) return;

    setError("");
    setSuccess("");
    setConfirmLoading(true);
    confirmandoRef.current = true;

    const valorTotal =
      parseNumber(valorInformado) ||
      itensLeitura.reduce((sum, item) => sum + item.valor_total, 0);

    try {
      await enviarNotaParaAprovacaoAction({
        notaId: notaIdIa,
        obraId,
        fornecedor,
        cnpj,
        dataNota,
        valorTotal,
        observacoes,
        itens: itensLeitura,
        enviadoPorNome: adminNome,
      });

      setSuccess(
        "Nota enviada para aprovação. Os gastos serão lançados após conferência do responsável."
      );
      resetForm();
      router.refresh();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Erro ao enviar nota para aprovação."
      );
    } finally {
      setConfirmLoading(false);
      confirmandoRef.current = false;
    }
  }

  function handleCancelarLeitura() {
    resetIaState();
    setSuccess("");
    setError("");
  }

  async function handleOpenNota(nota: NotaFiscal) {
    setError("");
    setOpeningId(nota.id);

    const result = await obterUrlArquivoNotaAdminAction(nota.arquivo_path);

    setOpeningId(null);

    if ("erro" in result) {
      setError(result.erro);
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function handleDeleteNota(nota: NotaFiscal) {
    const confirmed = window.confirm(
      `Excluir a nota "${nota.arquivo_nome}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(nota.id);

    const result = await excluirNotaAdminAction(nota.id, nota.arquivo_path);

    setDeletingId(null);

    if ("erro" in result) {
      setError(result.erro);
      return;
    }

    setSuccess("Nota fiscal excluída com sucesso.");
    router.refresh();
  }

  const totalItensLeitura = itensLeitura.reduce(
    (sum, item) => sum + item.valor_total,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <PendenciasAprovacao
        notas={notasIniciais}
        obras={obras}
        adminNome={adminNome}
      />

      <form
        onSubmit={handleSubmit}
        className="cedro-card p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
          Enviar nota fiscal
        </h2>
        <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
          Envie a nota e use a leitura com IA. Os gastos só entram após
          aprovação do responsável.
        </p>

        <div className="mt-6">
          <NotaFiscalUploadZone
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isDragging={isDragging}
            onFileSelect={handleFileSelection}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        </div>

        <div className="mt-6">
          <NotaFiscalCamposForm
            obras={obras}
            obraId={obraId}
            onObraIdChange={setObraId}
            dataNota={dataNota}
            onDataNotaChange={setDataNota}
            fornecedor={fornecedor}
            onFornecedorChange={setFornecedor}
            cnpj={cnpj}
            onCnpjChange={setCnpj}
            showCnpj={iaReviewMode}
            readOnlyObra={iaReviewMode}
            valorInformado={valorInformado}
            onValorInformadoChange={setValorInformado}
            observacoes={observacoes}
            onObservacoesChange={setObservacoes}
          />
        </div>

        {iaReviewMode ? (
          <NotaFiscalLeituraPreview
            variant="funcionario"
            itens={itensLeitura}
            onItemChange={handleItemChange}
            onRemoveItem={handleRemoveItem}
            onAddItem={handleAddItem}
            onConfirm={handleEnviarParaAprovacao}
            onCancel={handleCancelarLeitura}
            loading={confirmLoading}
            totalItens={totalItensLeitura}
            valorTotalNota={parseNumber(valorInformado) || undefined}
            alertas={alertasLeitura}
          />
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--cedro-border)] pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleLerComIA}
            disabled={iaLoading || loading || !selectedFile || !obraId}
            className="cedro-btn-secondary px-5 py-2.5 text-sm"
          >
            {iaLoading ? "Lendo com IA..." : "Ler com IA"}
          </button>
          <button
            type="submit"
            disabled={loading || iaLoading || !selectedFile}
            className="cedro-btn-primary px-5 py-2.5 text-sm"
          >
            {loading ? "Enviando..." : "Enviar nota fiscal"}
          </button>
        </div>

        {success ? (
          <p className="mt-4 text-sm text-[var(--cedro-success)]">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-[var(--cedro-error)]">{error}</p>
        ) : null}
      </form>

      <div className="cedro-card overflow-hidden">
        <div className="border-b border-[var(--cedro-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--cedro-text)]">
            Histórico de notas fiscais
          </h2>
          <p className="mt-1 text-sm text-[var(--cedro-text-muted)]">
            Notas já cadastradas no sistema.
          </p>
        </div>

        {notasIniciais.length === 0 ? (
          <p className="p-6 text-sm text-[var(--cedro-text-muted)]">
            Nenhuma nota fiscal cadastrada ainda.
          </p>
        ) : (
          <div className="cedro-table-wrap">
            <table className="cedro-table">
              <thead>
                <tr>
                  {[
                    "Data",
                    "Obra",
                    "Fornecedor",
                    "Valor",
                    "Origem",
                    "Arquivo",
                    "Status",
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
                {notasIniciais.map((nota) => (
                  <tr key={nota.id}>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatDate(nota.data_nota ?? nota.criado_em.slice(0, 10))}
                    </td>
                    <td className="whitespace-nowrap font-medium">
                      {getObraNomeNota(nota.obras)}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {nota.fornecedor ?? "—"}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {nota.valor_total != null
                        ? formatCurrency(nota.valor_total)
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap text-[var(--cedro-text-muted)]">
                      {formatOrigemNota(nota.origem)}
                      {nota.enviado_por_nome ? (
                        <span className="mt-0.5 block text-xs text-[var(--cedro-text-muted)]">
                          {nota.enviado_por_nome}
                        </span>
                      ) : null}
                    </td>
                    <td className="text-[var(--cedro-text-muted)]">
                      {nota.arquivo_nome}
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusNotaBadgeClass(nota.status_processamento)}`}
                      >
                        {formatStatusLabel(nota.status_processamento)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenNota(nota)}
                          disabled={openingId === nota.id}
                          className="text-sm font-medium text-[var(--cedro-brown)] underline-offset-4 hover:underline disabled:opacity-60"
                        >
                          {openingId === nota.id ? "Abrindo..." : "Abrir"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNota(nota)}
                          disabled={deletingId === nota.id}
                          className="text-sm font-medium text-[var(--cedro-error)] transition-colors hover:text-[var(--cedro-brown-dark)] disabled:opacity-60"
                        >
                          {deletingId === nota.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
