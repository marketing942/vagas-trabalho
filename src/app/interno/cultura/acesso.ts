import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export const COOKIE_ACESSO = "cppem_cultura_interna";

/** Senha da página interna (variável CULTURA_INTERNA_SENHA na Vercel). Sem ela, a página fica sem trava. */
export function senhaConfigurada(): string | null {
  return process.env.CULTURA_INTERNA_SENHA?.trim() || null;
}

export function tokenDaSenha(senha: string): string {
  return createHash("sha256").update(`cppem-cultura-interna:${senha}`).digest("hex");
}

export function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A pessoa pode ver a página? (sem senha configurada, sim) */
export function acessoLiberado(cookie: string | undefined): boolean {
  const senha = senhaConfigurada();
  if (!senha) return true;
  return !!cookie && igual(cookie, tokenDaSenha(senha));
}
