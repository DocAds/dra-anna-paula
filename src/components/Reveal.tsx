"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Fragment } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header";
};

export function Reveal({ children, delay = 0, y = 24, className, as = "div" }: Props) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  return (
    <Component
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

export function RevealText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <motion.span
            aria-hidden
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block"
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}
