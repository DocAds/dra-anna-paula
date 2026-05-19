type Props = { variant?: "cream" | "cocoa" | "dual"; intensity?: number };

export function LiquidBackdrop({ variant = "cream", intensity = 1 }: Props) {
  const blobs =
    variant === "cocoa"
      ? [
          { c: "#9F825B", x: "10%", y: "12%", s: 520 },
          { c: "#82614A", x: "78%", y: "62%", s: 600 },
          { c: "#DAC09B", x: "55%", y: "30%", s: 360 },
        ]
      : variant === "dual"
      ? [
          { c: "#D0BCA0", x: "8%", y: "20%", s: 520 },
          { c: "#9F825B", x: "82%", y: "70%", s: 580 },
          { c: "#E7DED0", x: "55%", y: "10%", s: 360 },
        ]
      : [
          { c: "#E7DED0", x: "12%", y: "18%", s: 540 },
          { c: "#D0BCA0", x: "78%", y: "65%", s: 620 },
          { c: "#DAC09B", x: "60%", y: "20%", s: 380 },
        ];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: 0.55 * intensity }}
    >
      {blobs.map((b, i) => (
        <span
          key={i}
          className="liquid-blob absolute rounded-full mix-blend-multiply animate-drift"
          style={{
            background: b.c,
            width: b.s,
            height: b.s,
            left: b.x,
            top: b.y,
            transform: "translate3d(0,0,0)",
            animationDelay: `${i * 1.6}s`,
            animationDuration: `${14 + i * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
