import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, align = "left", className }: Props) {
  return (
    <div
      className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""} ${className ?? ""}`}
    >
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-5 flex items-center gap-3">
          {align === "center" && <span className="h-px w-10 bg-toffee/50" />}
          <span>{eyebrow}</span>
          <span className="h-px w-10 bg-toffee/50" />
        </div>
      )}
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.02] text-ink text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-6 text-base md:text-lg text-ink/70 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
