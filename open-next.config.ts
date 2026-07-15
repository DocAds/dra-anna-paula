import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuração mínima: SSR + rotas de API + páginas estáticas (SSG) servidas
// direto. Sem cache incremental persistente por enquanto, então o `revalidate`
// por tempo das páginas SSG não regenera em background (o HTML do build é
// servido estático). Se precisarmos de ISR real depois, adicionar bindings de
// KV/R2 aqui (incrementalCache/tagCache).
export default defineCloudflareConfig();
