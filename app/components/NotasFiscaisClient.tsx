"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { enviarNotaParaAprovacaoAction } from "@/app/actions/notas-fiscais-aprovacao";
import PendenciasAprovacao from "@/app/components/notas-fiscais/PendenciasAprovacao";
import PerfilNotaFiscalBar from "@/app/components/notas-fiscais/PerfilNotaFiscalBar";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, parseNumber } from "@/lib/format";
import {
  criarItemVazio,
  syncItemTotal,
  type NotaFiscalItemExtraido,
  type NotaFiscalLeitura,
} from "@/lib/nota-fiscal-ia";
import type { AlertasLeitura } from "@/lib/nota-fiscal-validacao";
import { salvarClassificacaoAprendida } from "@/lib/nota-fiscal-classificacao-aprendida";
import {
  atualizarStatusNotaFiscal,
  criarNotaFiscalProcessando,
} from "@/lib/notas-fiscais-db";
import {
  buildStoragePath,
  formatStatusLabel,
  formatOrigemNota,
  getObraNomeNota,
  isAcceptedFile,
  isImageType,
  NOTAS_FISCAIS_BUCKET,
  NOTAS_FISCAIS_MAX_SIZE_BYTES,
  statusNotaBadgeClass,
  type NotaFiscal,
  type ObraOption,
} from "@/lib/notas-fiscais";
import NotaFiscalCamposForm from "@/app/components/notas-fiscais/NotaFiscalCamposForm";
import NotaFiscalLeituraPreview from "@/app/components/notas-fiscais/NotaFiscalLeituraPreview";
import NotaFiscalUploadZone from "@/app/components/notas-fiscais/NotaFiscalUploadZone";
import type { PerfilNotaFiscal } from "@/lib/nota-fiscal-perfil";
import {
  obterNomeUsuarioLocal,
  obterPerfilLocal,
} from "@/lib/nota-fiscal-perfil";

type NotasFiscaisClientProps = {
  obras: ObraOption[];
  notasIniciais: NotaFiscal[];
};

export default function NotasFiscaisClient({
  obras,
  notasIniciais,
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
  const [perfil, setPerfil] = useState<PerfilNotaFiscal>("funcionario");
  const [usuarioNome, setUsuarioNome] = useState("Funcionário");

  useEffect(() => {
    setPerfil(obterPerfilLocal());
    setUsuarioNome(obterNomeUsuarioLocal());
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

  async function uploadNotaParaStorage() {
    if (!selectedFile || !obraId) {
      return null;
    }

    const storagePath = buildStoragePath(obraId, selectedFile.name);

    const { error: uploadError } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .upload(storagePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedFile.type || undefined,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    return storagePath;
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

    const { error: insertError } = await supabase.from("notas_fiscais").insert({
      obra_id: obraId,
      arquivo_path: storagePath,
      arquivo_nome: selectedFile.name,
      arquivo_tipo: selectedFile.type || null,
      arquivo_tamanho: selectedFile.size,
      fornecedor: fornecedor.trim() || null,
      data_nota: dataNota || null,
      valor_total: valorInformado ? parseNumber(valorInformado) : null,
      observacoes: observacoes.trim() || null,
      origem: "manual",
      status_processamento: "aguardando",
    });

    if (insertError) {
      await supabase.storage.from(NOTAS_FISCAIS_BUCKET).remove([storagePath]);
      setLoading(false);
      setError(insertError.message);
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
        notaId = await criarNotaFiscalProcessando({
          obraId,
          storagePath,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || null,
          fileSize: selectedFile.size,
        });
        setNotaIdIa(notaId);
      } else {
        await atualizarStatusNotaFiscal(notaId, "processando");
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
          enviadoPorNome: usuarioNome,
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
        enviadoPorNome: usuarioNome,
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

    const { data, error: signedUrlError } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .createSignedUrl(nota.arquivo_path, 3600);

    setOpeningId(null);

    if (signedUrlError || !data?.signedUrl) {
      setError(signedUrlError?.message ?? "Não foi possível abrir o arquivo.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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

    const { error: storageError } = await supabase.storage
      .from(NOTAS_FISCAIS_BUCKET)
      .remove([nota.arquivo_path]);

    if (storageError) {
      setDeletingId(null);
      setError(storageError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("notas_fiscais")
      .delete()
      .eq("id", nota.id);

    setDeletingId(null);

    if (deleteError) {
      setError(deleteError.message);
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
      <PerfilNotaFiscalBar
        onChange={(p, nome) => {
          setPerfil(p);
          setUsuarioNome(nome);
        }}
      />

      <PendenciasAprovacao
        notas={notasIniciais}
        obras={obras}
        perfil={perfil}
        usuarioNome={usuarioNome}
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Enviar nota fiscal
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:justify-end dark:border-zinc-800">
          <button
            type="button"
            onClick={handleLerComIA}
            disabled={iaLoading || loading || !selectedFile || !obraId}
            className="rounded-lg border border-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            {iaLoading ? "Lendo com IA..." : "Ler com IA"}
          </button>
          <button
            type="submit"
            disabled={loading || iaLoading || !selectedFile}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Enviando..." : "Enviar nota fiscal"}
          </button>
        </div>

        {success ? (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Histórico de notas fiscais
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Notas já cadastradas no sistema.
          </p>
        </div>

        {notasIniciais.length === 0 ? (
          <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
            Nenhuma nota fiscal cadastrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
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
                      className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {notasIniciais.map((nota) => (
                  <tr
                    key={nota.id}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatDate(nota.data_nota ?? nota.criado_em.slice(0, 10))}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                      {getObraNomeNota(nota.obras)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {nota.fornecedor ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {nota.valor_total != null
                        ? formatCurrency(nota.valor_total)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatOrigemNota(nota.origem)}
                      {nota.enviado_por_nome ? (
                        <span className="mt-0.5 block text-xs text-zinc-500">
                          {nota.enviado_por_nome}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                      {nota.arquivo_nome}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusNotaBadgeClass(nota.status_processamento)}`}
                      >
                        {formatStatusLabel(nota.status_processamento)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenNota(nota)}
                          disabled={openingId === nota.id}
                          className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline disabled:opacity-60 dark:text-zinc-50"
                        >
                          {openingId === nota.id ? "Abrindo..." : "Abrir"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNota(nota)}
                          disabled={deletingId === nota.id}
                          className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
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
