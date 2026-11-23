import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowRight, Check, Clock, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES, SERVICES, formatEuro, formatMinutes, summarisePackage, type Category, type Service } from "@/lib/shop";
import { AnimatedNumber, Eyebrow, Reveal, RevealHeading, useSpotlight } from "./ui";
import { useBooking } from "./booking-context";

type Filter = "all" | Category;

export function Services() {
  const [filter, setFilter] = useState<Filter>("all");
  const { selected, toggle } = useBooking();
  const visible = SERVICES.filter((s) => filter === "all" || s.category === filter);

  return (
    <section id="services" className="relative scroll-mt-20 overflow-hidden py-28 md:py-36">
      <div className="hex-field pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-emerald/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow index="01">Services & pricing</Eyebrow>
            <RevealHeading className="mt-5" text="Pick your cut," accent="build your chair." />
          </div>
          <Reveal delay={0.2} className="max-w-sm text-muted-foreground">
            Tap services to add them. Your total and chair time update as you go — then send the whole package straight to booking.
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-12">
          <LayoutGroup id="filters">
            <div role="tablist" aria-label="Service categories" className="glass inline-flex flex-wrap gap-1 rounded-full p-1.5">
              {[{ id: "all" as Filter, label: "All" }, ...CATEGORIES].map((c) => {
                const on = filter === c.id;
                const count = c.id === "all" ? SERVICES.length : SERVICES.filter((s) => s.category === c.id).length;
                return (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setFilter(c.id)}
                    className={cn("relative rounded-full px-4 py-2 text-sm font-medium transition-colors", on ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground")}
                  >
                    {on && <motion.span layoutId="filter-pill" className="bg-brass absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                    <span className="relative flex items-center gap-2">
                      {c.label}
                      <span className={cn("font-mono text-[10px]", on ? "text-primary-foreground/70" : "text-muted-foreground")}>{count}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <motion.div layout className="grid content-start gap-4 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {visible.map((s, i) => (
                <ServiceCard key={s.id} service={s} index={i} selected={selected.includes(s.id)} onToggle={() => toggle(s.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
          <PackageBuilder />
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, index, selected, onToggle }: { service: Service; index: number; selected: boolean; onToggle: () => void }) {
  const spot = useSpotlight<HTMLButtonElement>();
  return (
    <motion.button
      ref={spot.ref}
      onPointerMove={spot.onPointerMove}
      layout
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "glass group relative overflow-hidden rounded-3xl p-6 text-left transition-colors",
        selected ? "border-brass/70" : "hover:border-foreground/25",
      )}
    >
      <div className="spotlight pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <AnimatePresence>
        {selected && (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,oklch(0.8_0.115_80/0.18),transparent_60%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {CATEGORIES.find((c) => c.id === service.category)?.label}
          </div>
          <h3 className="mt-2 font-display text-2xl leading-tight">{service.name}</h3>
        </div>
        <motion.span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
            selected ? "bg-brass border-transparent text-primary-foreground" : "border-glass-border text-foreground/70 group-hover:border-brass/60",
          )}
          animate={{ rotate: selected ? 0 : 0, scale: selected ? [1, 1.25, 1] : 1 }}
          transition={{ duration: 0.35 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                <Check className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span key="p" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                <Plus className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </div>
      <p className="relative mt-3 text-sm text-muted-foreground">{service.blurb}</p>
      <div className="relative mt-6 flex items-end justify-between">
        <span className="font-display text-3xl text-brass">{formatEuro(service.price)}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> ~{formatMinutes(service.minutes)}
        </span>
      </div>
    </motion.button>
  );
}

function PackageBuilder() {
  const { selected, toggle, setSelected, startBooking } = useBooking();
  const pkg = summarisePackage(selected);
  const maxMinutes = 120;

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <Reveal delay={0.15}>
        <div className="glass relative overflow-hidden rounded-3xl p-6">
          <div className="pointer-events-none absolute inset-0 bg-[var(--gradient-emerald)]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Your package</div>
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4 min-h-[120px]">
              <AnimatePresence initial={false}>
                {pkg.items.length === 0 && (
                  <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 text-center text-sm text-muted-foreground">
                    Nothing yet — tap a service to start.
                  </motion.p>
                )}
                {pkg.items.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, x: 24, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: -24, height: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-foreground/10 py-2.5">
                      <span className="text-sm">{s.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-xs tabular-nums text-foreground/70">{formatEuro(s.price)}</span>
                        <button onClick={() => toggle(s.id)} aria-label={`Remove ${s.name}`} className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {pkg.suggestion && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={() => {
                    const sug = pkg.suggestion!;
                    setSelected([...selected.filter((id) => !sug.replace.includes(id)), sug.withId]);
                  }}
                  className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-emerald/40 bg-emerald/10 p-3 text-left text-sm"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald" />
                  <span>
                    Swap to <strong>Haircut & Beard</strong> and save <strong className="text-emerald">{formatEuro(pkg.suggestion.saving)}</strong>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="mt-6">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <span>Chair time</span>
                <span className="text-foreground">~{formatMinutes(pkg.totalMinutes || 0)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
                <motion.div
                  className="bg-brass h-full rounded-full"
                  animate={{ width: `${Math.min(100, (pkg.totalMinutes / maxMinutes) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-5xl tabular-nums text-brass">
                <AnimatedNumber value={pkg.totalPrice} format={formatEuro} />
              </span>
            </div>

            <button
              disabled={!pkg.items.length}
              onClick={startBooking}
              className="bg-brass shadow-brass group mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              Book this package <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Times are approximate and may vary with your style.</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
