/**
 * Perfis de usuário — preparado para autenticação futura.
 * Enquanto não houver auth, usa modo local isolado via localStorage.
 */

export type PerfilNotaFiscal = "funcionario" | "aprovador";

const STORAGE_PERFIL = "cedro_nf_perfil";
const STORAGE_NOME = "cedro_nf_usuario_nome";

export function obterPerfilLocal(): PerfilNotaFiscal {
  if (typeof window === "undefined") return "funcionario";
  const valor = localStorage.getItem(STORAGE_PERFIL);
  return valor === "aprovador" ? "aprovador" : "funcionario";
}

export function definirPerfilLocal(perfil: PerfilNotaFiscal): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PERFIL, perfil);
}

export function obterNomeUsuarioLocal(): string {
  if (typeof window === "undefined") return "Funcionário";
  return localStorage.getItem(STORAGE_NOME)?.trim() || "Funcionário";
}

export function definirNomeUsuarioLocal(nome: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_NOME, nome.trim() || "Funcionário");
}

export function isModoAprovadorLocal(): boolean {
  return obterPerfilLocal() === "aprovador";
}

/** Verifica permissão de aprovação (server-side stub). */
export function podeAprovarNotas(perfil: PerfilNotaFiscal): boolean {
  return perfil === "aprovador";
}
