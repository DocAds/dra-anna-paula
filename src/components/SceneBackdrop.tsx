import Image from "next/image";

type Scene = "drapery" | "botanical" | "water" | "clay" | "curtain";

const map: Record<Scene, { src: string; tint?: string; position?: string }> = {
  drapery: { src: "/img/bg/hero-drapery-2400.webp", tint: "from-porcelain/60 via-porcelain/30 to-porcelain/70", position: "object-right" },
  botanical: { src: "/img/bg/section-botanical-2400.webp", tint: "from-bone/50 via-bone/30 to-bone/60" },
  water: { src: "/img/bg/section-water-2400.webp", tint: "from-porcelain/65 via-porcelain/40 to-porcelain/65" },
  clay: { src: "/img/bg/section-clay-2400.webp", tint: "from-bone/55 via-bone/30 to-bone/55" },
  curtain: { src: "/img/bg/cta-curtain-2400.webp", tint: "from-porcelain/70 via-porcelain/30 to-porcelain/70", position: "object-right" },
};

type Props = {
  scene: Scene;
  intensity?: number;
  className?: string;
};

export function SceneBackdrop({ scene, intensity = 1, className }: Props) {
  const s = map[scene];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{ opacity: intensity }}
    >
      <Image
        src={s.src}
        alt=""
        fill
        sizes="100vw"
        className={`object-cover ${s.position ?? ""}`}
        priority={false}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${s.tint}`} />
      <div className="absolute inset-0 grain" />
    </div>
  );
}
