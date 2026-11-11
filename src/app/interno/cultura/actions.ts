"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ACESSO, igual, senhaConfigurada, tokenDaSenha } from "./acesso";

export interface EstadoAcesso {
  erro: string | null;
}

export async function entrar(_: EstadoAcesso, dados: FormData): Promise<EstadoAcesso> {
  const senha = senhaConfigurada();
  if (!senha) redirect("/interno/cultura");

  const digitada = String(dados.get("senha") ?? "").trim();
  if (!digitada || !igual(tokenDaSenha(digitada), tokenDaSenha(senha))) {
    return { erro: "Senha incorreta. Peça a senha atual para o RH." };
  }

  const jar = await cookies();
  jar.set(COOKIE_ACESSO, tokenDaSenha(senha), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/interno",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/interno/cultura");
}
