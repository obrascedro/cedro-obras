/** Permissões de aprovação de notas — derivadas da sessão admin (A-01). */

/** Admin autenticado pode aprovar, rejeitar e solicitar correção. */
export function podeAprovarNotasComoAdmin(role: string): boolean {
  return role === "admin";
}
