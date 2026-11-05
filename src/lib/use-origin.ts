import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Endereço do site no navegador (ex.: https://vagas.cppem.com.br); vazio no servidor. */
export function useOrigin(): string {
  return useSyncExternalStore(noop, () => window.location.origin, () => "");
}
