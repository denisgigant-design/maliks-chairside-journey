import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HexMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 2 36 11v18L20 38 4 29V11Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 27V14l8 9 8-9v13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-brass">
      <span className="text-muted-foreground">{index}</span>
      <span className="h-px w-10 bg-brass/60" />
      {children}
    </div>
  );
}

const words = (text: string) => text.split(" ");

/** Heading that rises in word by word when it scrolls into view. */
export function RevealHeading({ text, accent, className }: { text: string; accent?: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const all = [...words(text).map((w) => ({ w, accent: false })), ...(accent ? words(accent).map((w) => ({ w, accent: true })) : [])];
  return (
    <h2 ref={ref} className={cn("font-display text-5xl leading-[0.95] tracking-tight md:text-7xl", className)}>
      {all.map(({ w, accent: a }, i) => (
        <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
          <motion.span
            className={cn("inline-block", a && "italic text-brass")}
            initial={{ y: "110%", rotate: 4 }}
            animate={inView ? { y: "0%", rotate: 0 } : {}}
            transition={{ duration: 0.9, delay: i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {w}
            {i < all.length - 1 ? "\u00a0" : ""}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

export function Reveal({ children, delay = 0, className, y = 32 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Number that springs to its new value. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(Math.round(v)));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/** Tracks the pointer for the brass spotlight hover effect. */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onPointerMove = (e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return { ref, onPointerMove };
}

export function LiveDot({ open }: { open: boolean }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className={cn("absolute inset-0 rounded-full animate-pulse-ring", open ? "bg-emerald" : "bg-neon")} />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", open ? "bg-emerald" : "bg-neon")} />
    </span>
  );
}
