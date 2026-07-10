import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#E7DED0",
        latte: "#D0BCA0",
        biscotti: "#DAC09B",
        toffee: "#9F825B",
        cocoa: "#82614A",
        ink: "#2B1F17",
        bone: "#F5EFE6",
        porcelain: "#FBF7F1",
      },
      fontFamily: {
        display: ['"Hatton"', "var(--font-fraunces)", "Georgia", "serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        widest2: "0.28em",
        widest3: "0.38em",
      },
      backdropBlur: {
        xs: "4px",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(20px,-15px,0)" },
        },
      },
      animation: {
        shimmer: "shimmer 4s linear infinite",
        floaty: "floaty 8s ease-in-out infinite",
        drift: "drift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
