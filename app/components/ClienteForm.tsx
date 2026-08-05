"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  criarClienteAdminAction,
} from "@/app/actions/clientes-admin";
import type { AdminActionState } from "@/app/actions/obras-admin";
import {
  btnPrimaryClassName,
  inputClassName,
  labelClassName,
} from "@/app/components/ui/form-styles";

export default function ClienteForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");
    setLoading(true);

    const formData = new FormData();
    formData.set("nome", nome);
    formData.set("email", email);
    formData.set("telefone", telefone);

    startTransition(async () => {
      const result: AdminActionState = await criarClienteAdminAction({}, formData);
      setLoading(false);

      if (result.erro) {
        setMensagem(result.erro);
        return;
      }

      setNome("");
      setEmail("");
      setTelefone("");
      setMensagem(result.sucesso ?? "Cliente cadastrado com sucesso!");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className={labelClassName}>
          Nome
        </label>
        <input
          id="nome"
          type="text"
          required
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="telefone" className={labelClassName}>
          Telefone
        </label>
        <input
          id="telefone"
          type="tel"
          required
          value={telefone}
          onChange={(event) => setTelefone(event.target.value)}
          className={inputClassName}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`mt-2 ${btnPrimaryClassName}`}
      >
        {loading ? "Salvando..." : "Cadastrar cliente"}
      </button>

      {mensagem && (
        <p
          className={`text-sm ${
            mensagem.includes("sucesso")
              ? "text-[var(--cedro-success)]"
              : "text-[var(--cedro-error)]"
          }`}
        >
          {mensagem}
        </p>
      )}
    </form>
  );
}
