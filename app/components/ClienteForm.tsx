"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClienteForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");
    setLoading(true);

    const { error } = await supabase.from("clientes").insert({
      nome,
      email,
      telefone,
    });

    setLoading(false);

    if (error) {
      setMensagem(error.message);
      return;
    }

    setNome("");
    setEmail("");
    setTelefone("");
    setMensagem("Cliente cadastrado com sucesso!");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nome
        </label>
        <input
          id="nome"
          type="text"
          required
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="telefone" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Telefone
        </label>
        <input
          id="telefone"
          type="tel"
          required
          value={telefone}
          onChange={(event) => setTelefone(event.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {loading ? "Salvando..." : "Cadastrar cliente"}
      </button>

      {mensagem && (
        <p
          className={`text-sm ${
            mensagem === "Cliente cadastrado com sucesso!"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {mensagem}
        </p>
      )}
    </form>
  );
}
