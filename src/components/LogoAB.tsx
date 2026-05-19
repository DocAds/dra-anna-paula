import Image from "next/image";

type Props = {
  className?: string;
  tone?: "dark" | "light";
  variant?: "full" | "monogram" | "lockup";
};

const variants = {
  full: {
    dark: "/logo/logo-cocoa-full-720.webp",
    light: "/logo/logo-cream-full-720.webp",
    w: 720,
    h: 141,
  },
  monogram: {
    dark: "/logo/monogram-cocoa-720.webp",
    light: "/logo/monogram-cream-720.webp",
    w: 701,
    h: 538,
  },
  lockup: {
    dark: "/logo/lockup-cocoa-720.webp",
    light: "/logo/lockup-cream-720.webp",
    w: 720,
    h: 69,
  },
} as const;

export function LogoAB({ className, tone = "dark", variant = "full" }: Props) {
  const v = variants[variant];
  return (
    <Image
      src={tone === "dark" ? v.dark : v.light}
      alt="Anna Bomtempo Dermatologista"
      width={v.w}
      height={v.h}
      priority
      className={className}
    />
  );
}
