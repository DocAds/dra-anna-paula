// Skeleton enquanto o servidor busca os leads. Espelha o cabeçalho e as linhas
// da lista para não haver salto de layout ao trocar do esqueleto para os dados.
export default function LoadingLeads() {
  return (
    <main className="p-8 md:p-12" aria-busy="true" aria-label="Carregando leads">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div className="space-y-3">
          <div className="h-3 w-10 rounded-full bg-cocoa/15" />
          <div className="h-9 w-40 rounded-lg bg-cocoa/15" />
          <div className="h-4 w-32 rounded-full bg-cocoa/10" />
        </div>
        <div className="h-10 w-44 rounded-full bg-cocoa/10" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="h-11 flex-1 min-w-[200px] rounded-full bg-cocoa/10" />
        <div className="h-11 w-40 rounded-full bg-cocoa/10" />
        <div className="h-11 w-24 rounded-full bg-cocoa/15" />
      </div>

      <ul className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="editorial-card rounded-3xl px-6 py-5 flex items-center justify-between gap-4 animate-pulse motion-reduce:animate-none"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="h-5 w-1/3 min-w-[120px] rounded-md bg-cocoa/15" />
              <div className="h-3 w-2/3 min-w-[160px] rounded-full bg-cocoa/10" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-6 w-16 rounded-full bg-cocoa/10" />
              <div className="h-6 w-20 rounded-full bg-cocoa/10" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
