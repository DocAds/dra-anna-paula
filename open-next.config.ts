import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import kvTagCache from "@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache";

// Cache incremental (KV) reativa o ISR: páginas com `revalidate` (ex: /blog a
// cada 60s) e o `revalidatePath("/blog")` disparado ao publicar/editar/apagar
// post no admin voltam a atualizar sem precisar de redeploy, como era na Vercel.
// - incrementalCache: guarda o HTML/RSC renderizado (binding NEXT_INC_CACHE_KV)
// - tagCache: resolve revalidatePath/revalidateTag (binding NEXT_TAG_CACHE_KV)
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  tagCache: kvTagCache,
});
