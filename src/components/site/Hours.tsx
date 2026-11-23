import { AnimatePresence, motion } from "motion/react";
import { Armchair, Moon, Sun, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { CHAIRS, HOURS, busyLabel, busyness, chairsFree, dublinParts, formatClock, hoursFor, shopStatus } from "@/lib/shop";
import { Eyebrow, LiveDot, Reveal, RevealHeading } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

export function Hours() {
  const now = useNow(1000);
  const status = now ? shopStatus(now) : null;
  const parts = now ? dublinParts(now) : null;
  const [day, setDay] = useState<number | null>(null);
  const [hour, setHour] = useState<number | null>(null);

  // Default to today and the current (or opening) hour once the clock is known.
  useEffect(() => {
    if (!parts || day !== null) return;
    setDay(parts.dayIndex);
    const h = hoursFor(parts.dayIndex);
    const cur = Math.floor(parts.minutes / 60);
    setHour(cur * 60 >= h.open && cur * 60 < h.close ? cur : Math.floor(h.open / 60));
  }, [parts, day]);

  const selDay = day ?? 0;
  const dh = hoursFor(selDay);
  const hours = Array.from({ length: (dh.close - dh.open) / 60 }, (_, i) => Math.floor(dh.open / 60) + i);
  const selHour = hour !== null && hours.includes(hour) ? hour : (hours[0] ?? 10);
  const ranked = [...hours].sort((a, b) => busyness(selDay, a) - busyness(selDay, b));
  const quietest = ranked[0] ?? selHour;
  const busiest = ranked.at(-1) ?? selHour;
  const isToday = parts?.dayIndex === selDay;
  const nowHourFloat = parts ? parts.minutes / 60 : 0;

  return (
    <section id="hours" className="relative scroll-mt-20 overflow-hidden py-28 md:py-36">
      <div className="pointer-events-none absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-brass/10 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Eyebrow index="02">Opening hours</Eyebrow>
        <RevealHeading className="mt-5" text="Seven days a week," accent="here's when to drop in." />

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          {/* Live status */}
          <Reveal className="lg:col-span-5">
            <div className="glass relative h-full overflow-hidden rounded-3xl p-7">
              <div className="pointer-events-none absolute inset-0 bg-[var(--gradient-emerald)]" />
              <div className="relative">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {status ? <LiveDot open={status.open} /> : null} Live in Dublin
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={status?.open ? "open" : "closed"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn("mt-4 font-display text-6xl md:text-7xl", status?.open ? "text-foreground" : "neon-text animate-flicker")}
                  >
                    {status ? (status.open ? "Open now" : "Closed") : "—"}
                  </motion.div>
                </AnimatePresence>
                <p className="mt-2 text-muted-foreground">
                  {status
                    ? status.open
                      ? `Closing at ${formatClock(status.changeAt)} today`
                      : `Opens ${status.changeDayIndex === status.todayIndex ? "today" : HOURS[status.changeDayIndex]!.day} at ${formatClock(status.changeAt)}`
                    : "Checking the time…"}
                </p>

                <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {status?.open ? "Time left to get a cut" : "Doors open in"}
                </div>
                <div className="mt-3 flex gap-2">
                  {(status
                    ? [Math.floor(status.secondsUntilChange / 3600), Math.floor((status.secondsUntilChange % 3600) / 60), status.secondsUntilChange % 60]
                    : [0, 0, 0]
                  ).map((v, i) => (
                    <div key={i} className="flex-1 rounded-2xl border border-glass-border bg-background/40 p-3 text-center">
                      <div className="relative h-12 overflow-hidden font-display text-4xl tabular-nums">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={v}
                            className="absolute inset-0"
                            initial={{ y: "-100%", opacity: 0 }}
                            animate={{ y: "0%", opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                          >
                            {pad(v)}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{["hrs", "min", "sec"][i]}</div>
                    </div>
                  ))}
                </div>

                <ul className="mt-8 space-y-1 text-sm">
                  {HOURS.map((h, i) => (
                    <li key={h.day} className={cn("flex justify-between rounded-lg px-2 py-1.5 transition-colors", parts?.dayIndex === i ? "bg-brass/15" : "text-foreground/70")}>
                      <span className="flex items-center gap-2">
                        {h.day}
                        {parts?.dayIndex === i && <span className="rounded-full bg-brass px-1.5 py-0.5 font-mono text-[9px] uppercase text-primary-foreground">Today</span>}
                      </span>
                      <span className="tabular-nums">
                        {formatClock(h.open)} – {formatClock(h.close)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Day explorer */}
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="glass h-full rounded-3xl p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Peak vs quiet</div>
                  <h3 className="mt-1 font-display text-3xl">{HOURS[selDay]!.day}</h3>
                </div>
                <div className="flex gap-1">
                  {HOURS.map((h, i) => (
                    <button
                      key={h.short}
                      onClick={() => setDay(i)}
                      aria-pressed={selDay === i}
                      className={cn("relative h-10 w-10 rounded-xl text-xs font-semibold transition-colors", selDay === i ? "text-primary-foreground" : "text-foreground/70 hover:bg-secondary")}
                    >
                      {selDay === i && <motion.span layoutId="day-pill" className="bg-brass absolute inset-0 rounded-xl" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                      <span className="relative">{h.short.slice(0, 2)}</span>
                      {parts?.dayIndex === i && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Busyness chart */}
              <div className="relative mt-10 flex h-48 items-end gap-1.5">
                {hours.map((h, i) => {
                  const b = busyness(selDay, h);
                  const label = busyLabel(b);
                  const on = h === selHour;
                  return (
                    <button
                      key={`${selDay}-${h}`}
                      onClick={() => setHour(h)}
                      onMouseEnter={() => setHour(h)}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end"
                      aria-label={`${formatClock(h * 60)}: ${label}`}
                    >
                      <motion.div
                        className={cn(
                          "w-full rounded-t-lg transition-colors",
                          label === "Peak" ? "bg-neon/80" : label === "Steady" ? "bg-brass/80" : "bg-emerald/70",
                          on ? "opacity-100" : "opacity-50 group-hover:opacity-80",
                        )}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${Math.max(8, b * 100)}%` }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.7, delay: i * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
                      />
                      <span className={cn("mt-2 font-mono text-[9px] tabular-nums", on ? "text-foreground" : "text-muted-foreground")}>
                        {h > 12 ? h - 12 : h}
                      </span>
                    </button>
                  );
                })}
                {isToday && nowHourFloat * 60 >= dh.open && nowHourFloat * 60 < dh.close && (
                  <motion.div
                    className="pointer-events-none absolute bottom-6 top-0 w-px bg-foreground"
                    style={{ left: `${((nowHourFloat * 60 - dh.open) / (dh.close - dh.open)) * 100}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1.5 py-0.5 font-mono text-[9px] uppercase text-background">Now</span>
                  </motion.div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald/70" />Quiet</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-brass/80" />Steady</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-neon/80" />Peak</span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Stat icon={<TrendingDown className="h-4 w-4 text-emerald" />} label="Quietest" value={`${formatClock(quietest * 60)}`} />
                <Stat icon={<TrendingUp className="h-4 w-4 text-neon" />} label="Busiest" value={`${formatClock(busiest * 60)}`} />
                <Stat icon={selHour < 15 ? <Sun className="h-4 w-4 text-brass" /> : <Moon className="h-4 w-4 text-brass" />} label="Selected" value={`${formatClock(selHour * 60)} · ${busyLabel(busyness(selDay, selHour))}`} />
              </div>

              {/* Chair availability */}
              <div className="mt-8 rounded-2xl border border-glass-border bg-background/30 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Chair availability</div>
                  <div className="text-sm text-muted-foreground">
                    <AnimatePresence mode="wait">
                      <motion.span key={`${selDay}-${selHour}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="inline-block">
                        ~{chairsFree(selDay, selHour)} of {CHAIRS} free around {formatClock(selHour * 60)}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {Array.from({ length: CHAIRS }, (_, i) => {
                    const free = i < chairsFree(selDay, selHour);
                    return (
                      <motion.div
                        key={i}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border py-4 transition-colors",
                          free ? "border-emerald/50 bg-emerald/10 text-emerald" : "border-glass-border bg-foreground/5 text-foreground/35",
                        )}
                        animate={{ scale: free ? 1 : 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.05 }}
                      >
                        <Armchair className="h-7 w-7" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em]">{free ? "Free" : "Busy"}</span>
                      </motion.div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">Estimates from a typical week, not live bookings. Walk-ins always welcome.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-background/30 p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-2 font-display text-xl">
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
