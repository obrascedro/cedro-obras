"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { AdminActionState } from "@/app/actions/obras-admin";

export async function criarClienteAdminAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const telefone = String(formData.get("telefone") ?? "").trim();

    if (!nome || !email || !telefone) {
      return { erro: "Preencha todos os campos." };
    }

    const { error } = await supabase.from("clientes").insert({
      nome,
      email,
      telefone,
    });

    if (error) return { erro: error.message };

    revalidatePath("/clientes");
    revalidatePath("/obras/nova");
    return { sucesso: "Cliente cadastrado com sucesso!" };
  } catch (error) {
    return {
      erro:
        error instanceof Error ? error.message : "Erro ao cadastrar cliente.",
    };
  }
}
