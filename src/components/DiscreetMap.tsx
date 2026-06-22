type Props = {
  query: string;
  className?: string;
  minHeight?: number;
};

/**
 * Mapa Google embutido em estética discreta (dessaturado/quente), que ganha cor
 * no hover. Embed sem chave (output=embed). loading=lazy para não pesar no LCP.
 */
export function DiscreetMap({ query, className, minHeight = 280 }: Props) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-cocoa/15 bg-cream ${className ?? ""}`}
    >
      <iframe
        title={`Mapa: ${query}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        style={{ border: 0, minHeight }}
        className="h-full w-full grayscale-[0.25] sepia-[0.18] contrast-[0.96] opacity-90 transition-all duration-700 ease-editorial group-hover:grayscale-0 group-hover:sepia-0 group-hover:opacity-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-cocoa/10"
      />
    </div>
  );
}
