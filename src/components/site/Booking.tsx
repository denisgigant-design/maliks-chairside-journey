import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Bike, Bus, Car, Check, Copy, Footprints, MapPin, MessageSquare, ParkingCircle, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import {
  SERVICES,
  SHOP,
  bookingMessage,
  busyLabel,
  busyness,
  directionsHref,
  dublinParts,
  formatClock,
  formatEuro,
  formatMinutes,
  shopStatus,
  slotsFor,
  smsHref,
  summarisePackage,
  telHref,
  upcomingDays,
} from "@/lib/shop";
import { useBooking } from "./booking-context";
import { Eyebrow, LiveDot, Reveal, RevealHeading } from "./ui";

const STEPS = ["Service", "Day", "Time", "Confirm"] as const;

export function Booking() {
  return (
    <section id="book" className="relative scroll-mt-20 overflow-hidden py-28 md:py-36">
      <div className="hex-field pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/3 top-10 h-[520px] w-[520px] rounded-full bg-emerald/10 blur-[140px]" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Eyebrow index="03">Booking & contact</Eyebrow>
        <RevealHeading className="mt-5" text="Lock in your chair" accent="in four taps." />
        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <BookingFlow />
          </Reveal>
          <div className="grid gap-5 lg:col-span-5">
            <Reveal delay={0.1}>
              <CallLauncher />
            </Reveal>
            <Reveal delay={0.2}>
              <Directions />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingFlow() {
  const { selected, toggle, bookingNonce } = useBooking();
  const now = useNow(60000);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const days = useMemo(() => (now ? upcomingDays(now) : []), [now]);
  const day = days.find((d) => d.key === dayKey) ?? null;
  const pkg = summarisePackage(selected);
  const parts = now ? dublinParts(now) : null;
  const slots = day ? slotsFor(day.dayIndex, Math.max(15, pkg.totalMinutes), 30, day.offset === 0 && parts ? parts.minutes + 15 : -1) : [];

  useEffect(() => {
    if (bookingNonce === 0) return;
    setDir(1);
    setStep(selected.length ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingNonce]);

  useEffect(() => {
    if (time !== null && !slots.includes(time)) setTime(null);
  }, [slots, time]);

  const canNext = [pkg.items.length > 0, !!day, time !== null, true][step];
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  const message = day && time !== null ? bookingMessage({ serviceIds: selected, dayLabel: day.longLabel, time, name, note }) : "";

  return (
    <div className="glass relative overflow-hidden rounded-3xl">
      {/* Stepper */}
      <div className="border-b border-glass-border p-6">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const on = i === step;
            return (
              <button
                key={label}
                onClick={() => i <= step && go(i)}
                disabled={i > step}
                className="group flex flex-1 items-center gap-2 text-left disabled:cursor-default"
              >
                <span
                  className={cn(
                    "relative grid h-8 w-8 shrink-0 place-items-center rounded-full border font-mono text-xs transition-colors",
                    on && "border-brass text-brass",
                    done && "bg-brass border-transparent text-primary-foreground",
                    !on && !done && "border-glass-border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                  {on && <motion.span layoutId="step-ring" className="absolute -inset-1 rounded-full border border-brass/40" />}
                </span>
                <span className={cn("hidden text-sm sm:inline", on ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-foreground/10">
          <motion.div className="bg-brass h-full" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      </div>

      {/* Step body */}
      <div className="relative min-h-[420px] overflow-hidden p-6">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: dir * -60, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {step === 0 && (
              <div>
                <h3 className="font-display text-2xl">What are we doing today?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Choose one or more services.</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {SERVICES.map((s) => {
                    const on = selected.includes(s.id);
                    return (
                      <motion.button
                        key={s.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggle(s.id)}
                        aria-pressed={on}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border p-3.5 text-left transition-colors",
                          on ? "border-brass/70 bg-brass/10" : "border-glass-border hover:border-foreground/30",
                        )}
                      >
                        <span>
                          <span className="block text-sm font-medium">{s.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">~{formatMinutes(s.minutes)}</span>
                        </span>
                        <span className={cn("font-mono text-xs", on ? "text-brass" : "text-foreground/60")}>{formatEuro(s.price)}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="font-display text-2xl">Which day suits?</h3>
                <p className="mt-1 text-sm text-muted-foreground">The next seven days.</p>
                <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {days.map((d, i) => {
                    const on = d.key === dayKey;
                    const left = slotsFor(d.dayIndex, Math.max(15, pkg.totalMinutes), 30, d.offset === 0 && parts ? parts.minutes + 15 : -1).length;
                    return (
                      <motion.button
                        key={d.key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={left === 0}
                        onClick={() => setDayKey(d.key)}
                        className={cn(
                          "relative flex flex-col items-center rounded-2xl border px-2 py-4 transition-colors disabled:opacity-30",
                          on ? "bg-brass border-transparent text-primary-foreground" : "border-glass-border hover:border-brass/50",
                        )}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{d.offset === 0 ? "Today" : d.weekday}</span>
                        <span className="mt-1 font-display text-2xl">{d.dateLabel.split(" ")[0]}</span>
                        <span className={cn("text-[10px]", on ? "text-primary-foreground/70" : "text-muted-foreground")}>{d.dateLabel.split(" ")[1]}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && day && (
              <div>
                <h3 className="font-display text-2xl">Pick a time</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {day.longLabel} · about {formatMinutes(pkg.totalMinutes)} in the chair
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((t, i) => {
                    const on = t === time;
                    const label = busyLabel(busyness(day.dayIndex, Math.floor(t / 60)));
                    return (
                      <motion.button
                        key={t}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(i * 0.015, 0.4) }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setTime(t)}
                        className={cn(
                          "relative rounded-xl border px-2 py-2.5 text-sm tabular-nums transition-colors",
                          on ? "bg-brass border-transparent font-semibold text-primary-foreground" : "border-glass-border hover:border-brass/50",
                        )}
                      >
                        {formatClock(t)}
                        <span
                          className={cn(
                            "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full",
                            label === "Peak" ? "bg-neon" : label === "Steady" ? "bg-brass" : "bg-emerald",
                          )}
                        />
                      </motion.button>
                    );
                  })}
                </div>
                <p className="mt-4 flex gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald" />Usually quiet</span>
                  <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-neon" />Usually busy</span>
                </p>
              </div>
            )}

            {step === 3 && day && time !== null && (
              <div>
                <h3 className="font-display text-2xl">Almost done</h3>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Your name</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={60}
                        placeholder="e.g. Conor"
                        className="mt-1 w-full rounded-xl border border-input bg-background/40 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brass"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Anything we should know? (optional)</span>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={240}
                        rows={3}
                        placeholder="Fade height, beard length…"
                        className="mt-1 w-full resize-none rounded-xl border border-input bg-background/40 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brass"
                      />
                    </label>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, rotateX: -15, y: 20 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    className="relative overflow-hidden rounded-2xl border border-brass/40 bg-background/50 p-5"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Your ticket</div>
                    <div className="mt-3 font-display text-xl leading-snug">{pkg.items.map((s) => s.name).join(" + ")}</div>
                    <div className="mt-3 border-t border-dashed border-foreground/20 pt-3 text-sm text-foreground/80">
                      {day.longLabel}
                      <br />
                      {formatClock(time)} · ~{formatMinutes(pkg.totalMinutes)}
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-xs text-muted-foreground">Pay in shop</span>
                      <span className="font-display text-3xl text-brass">{formatEuro(pkg.totalPrice)}</span>
                    </div>
                  </motion.div>
                </div>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <a
                    href={smsHref(message)}
                    className="bg-brass shadow-brass inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <MessageSquare className="h-4 w-4" /> Send request by text
                  </a>
                  <a href={telHref} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-glass-border px-5 py-3 text-sm font-medium hover:bg-secondary">
                    <Phone className="h-4 w-4" /> Call to book
                  </a>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">Opens your messages with the details filled in. The shop will text back to confirm.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-glass-border p-5">
        <button
          onClick={() => go(Math.max(0, step - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-0"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          {pkg.items.length} item{pkg.items.length === 1 ? "" : "s"} · <span className="text-brass">{formatEuro(pkg.totalPrice)}</span>
        </div>
        {step < 3 ? (
          <button
            onClick={() => go(step + 1)}
            disabled={!canNext}
            className="bg-brass group inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground transition-all disabled:opacity-30"
          >
            Next <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <span className="w-20" />
        )}
      </div>
    </div>
  );
}

function CallLauncher() {
  const now = useNow(30000);
  const s = now ? shopStatus(now) : null;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHOP.phoneDisplay);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6">
      <div className="flex items-center gap-5">
        <motion.a
          href={telHref}
          aria-label={`Call ${SHOP.phoneDisplay}`}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          className="bg-brass shadow-brass relative grid h-20 w-20 shrink-0 place-items-center rounded-full text-primary-foreground"
        >
          <span className="absolute inset-0 rounded-full bg-brass/50 animate-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-brass/40 animate-pulse-ring [animation-delay:0.6s]" />
          <motion.span animate={{ rotate: [0, -14, 12, -8, 0] }} transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 2.4 }}>
            <Phone className="relative h-7 w-7" />
          </motion.span>
        </motion.a>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {s && <LiveDot open={s.open} />}
            {s ? (s.open ? "Lines open" : "Closed — leave a text") : "Call the shop"}
          </div>
          <a href={telHref} className="mt-1 block font-display text-3xl tracking-tight md:text-4xl">
            {SHOP.phoneDisplay}
          </a>
          <button onClick={copy} className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span key="ok" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5 text-emerald">
                  <Check className="h-3.5 w-3.5" /> Copied
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Copy number
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
}

const MODES = [
  { id: "driving", label: "Drive", icon: Car, tip: "Free parking right at the shop." },
  { id: "transit", label: "Bus", icon: Bus, tip: "Get live bus routes and times to Mulhuddart Village." },
  { id: "walking", label: "Walk", icon: Footprints, tip: "In the heart of Mulhuddart Village." },
  { id: "bicycling", label: "Cycle", icon: Bike, tip: "Plan a cycle route to Riverpark View." },
] as const;

function Directions() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("driving");
  const m = MODES.find((x) => x.id === mode)!;
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="relative h-52 overflow-hidden">
        <iframe
          title="Map to Malik’s Barbers"
          src={`https://www.google.com/maps?q=${encodeURIComponent(SHOP.addressQuery)}&output=embed`}
          className="h-full w-full border-0 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.5)_brightness(0.9)]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            key={mode}
            d={
              mode === "driving"
                ? "M10 190 C 90 150, 120 170, 170 120 S 260 70, 200 100"
                : mode === "transit"
                  ? "M390 180 L 300 160 L 280 110 L 220 100 L 200 100"
                  : mode === "walking"
                    ? "M40 20 C 80 60, 140 40, 160 80 S 190 110, 200 100"
                    : "M380 20 C 330 60, 300 40, 260 70 S 220 110, 200 100"
            }
            fill="none"
            stroke="var(--brass)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </svg>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brass" />
          <address className="not-italic text-sm leading-relaxed">
            {SHOP.addressLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </address>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-background/40 p-1">
          {MODES.map((x) => {
            const Icon = x.icon;
            const on = x.id === mode;
            return (
              <button key={x.id} onClick={() => setMode(x.id)} aria-pressed={on} className={cn("relative flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs transition-colors", on ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {on && <motion.span layoutId="mode-pill" className="bg-brass absolute inset-0 rounded-xl" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{x.label}</span>
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            {mode === "driving" && <ParkingCircle className="h-4 w-4 text-emerald" />}
            {m.tip}
          </motion.p>
        </AnimatePresence>
        <a
          href={directionsHref(mode)}
          target="_blank"
          rel="noreferrer"
          className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-glass-border px-5 py-3 text-sm font-medium transition-colors hover:border-brass hover:text-brass"
        >
          Open {m.label.toLowerCase()} directions <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  );
}
