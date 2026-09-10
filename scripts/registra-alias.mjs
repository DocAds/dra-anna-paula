// Registra o gancho de alias no carregador de módulos.
// Uso: node --import ./scripts/registra-alias.mjs --test "src/**/*.test.ts"
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hook.mjs", pathToFileURL(`${import.meta.dirname}/`));
