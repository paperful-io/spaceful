import { motion } from "motion/react";
import type { ReactNode } from "react";

import { Code } from "./code";

/**
 * One feature of the library: a description and code on one side, a live
 * canvas on the other.
 */
export function DemoSection({
  id,
  index,
  title,
  children,
  code,
  demo,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
  code: string;
  demo: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-shade-200 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:px-6"
      >
        <div className="flex flex-col gap-5">
          <span className="font-mono text-sm text-primary">
            {String(index).padStart(2, "0")}
          </span>
          <h2 className="font-display text-3xl font-semibold text-shade-900 md:text-4xl">
            {title}
          </h2>
          <div className="flex flex-col gap-3 text-shade-600 [&_code]:rounded [&_code]:bg-shade-200/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-shade-800">
            {children}
          </div>
          <Code code={code} />
        </div>

        <div className="h-[440px] overflow-hidden rounded-3xl border border-shade-200 shadow-xl shadow-shade-900/5 md:h-[520px]">
          {demo}
        </div>
      </motion.div>
    </section>
  );
}

/** A small floating panel for live values on top of a demo canvas. */
export function Readout({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-xl border border-shade-200 bg-shade-50/85 px-3 py-2 font-mono text-xs text-shade-600 backdrop-blur">
      {children}
    </div>
  );
}

export function ReadoutRow({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "yes" | "no";
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span>{label}</span>
      <span
        className={
          tone === "yes"
            ? "text-primary"
            : tone === "no"
              ? "text-shade-400"
              : "text-shade-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
