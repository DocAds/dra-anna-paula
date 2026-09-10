// Gancho de resolução para os testes: traduz "@/..." em "src/..." e completa a
// extensão que o TypeScript deixa implícita.
//
// O Next entende o alias pelo tsconfig, mas `node --test` não: sem isto,
// qualquer teste que importe um módulo com dependência interna morre em
// ERR_MODULE_NOT_FOUND. Fica em scripts/ porque é ferramenta de teste.

import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

const SRC = resolvePath(import.meta.dirname, "..", "src");
const EXTENSOES = [".ts", ".tsx", ".mjs", ".js", "/index.ts"];

export async function resolve(especificador, contexto, proximo) {
  if (!especificador.startsWith("@/")) return proximo(especificador, contexto);

  const base = resolvePath(SRC, especificador.slice(2));
  const alvo = existsSync(base) ? base : EXTENSOES.map((e) => `${base}${e}`).find(existsSync);
  if (!alvo) return proximo(especificador, contexto);
  return proximo(pathToFileURL(alvo).href, contexto);
}
