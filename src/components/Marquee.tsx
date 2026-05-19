"use client";

import { motion } from "framer-motion";

type Props = { items: string[]; duration?: number };

export function Marquee({ items, duration = 38 }: Props) {
  const loop = [...items, ...items];
  return (
    <div className="marquee overflow-hidden">
      <motion.div
        className="flex gap-12 whitespace-nowrap py-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {loop.map((item, i) => (
          <span
            key={i}
            className="font-display text-3xl md:text-5xl text-cocoa/45 tracking-tight"
          >
            {item}
            <span className="mx-12 text-cocoa/25">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
