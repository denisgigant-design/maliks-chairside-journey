import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { ArrowDown, ArrowRight, Clock, Phone, Scissors } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { HOURS, SERVICES, formatClock, formatEuro, shopStatus, telHref, SHOP } from "@/lib/shop";
import { LiveDot } from "./ui";

type Pointer = { url: string };
const sortUrls = (mods: Record<string, Pointer>) =>
  Object.keys(mods)
    .sort()
    .map((k) => mods[k]!.url);

const DESKTOP = sortUrls(
  import.meta.glob<Pointer>("../../assets/tour/desktop/*.asset.json", { eager: true, import: "default" }),
);
const MOBILE = sortUrls(
  import.meta.glob<Pointer>("../../assets/tour/mobile/*.asset.json", { eager: true, import: "default" }),
);
const COUNT = DESKTOP.length;
const LAST = COUNT - 1;

/** Stations are frames 85, 131 and 206 of the original 240-frame film (every 2nd frame kept). */
export const STATIONS = [
  { id: "entrance", label: "Entrance", frame: 0 },
  { id: "hours", label: "Opening hours", frame: 42 },
  { id: "booking", label: "Booking", frame: 65 },
  { id: "pricing", label: "Pricing", frame: 103 },
] as const;
type StationId = (typeof STATIONS)[number]["id"];
const STATION_RADIUS = 5;
const SNAP_RADIUS = 9;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function Tour() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [variant, setVariant] = useState<"desktop" | "mobile" | null>(null);
  const progress = useMotionValue(0);
  const heroOpacity = useTransform(progress, [0, 0.07], [1, 0]);
  const heroY = useTransform(progress, [0, 0.07], [0, -80]);
  const heroScale = useTransform(progress, [0, 0.07], [1, 0.94]);
  const vignette = useTransform(progress, [0, 0.08], [0.85, 0.35]);

  const draw = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const imgs = imagesRef.current;
    if (!canvas || !ctx || !imgs.length) return;
    let img: HTMLImageElement | undefined;
    for (let d = 0; d <= LAST && !img; d++) {
      for (const i of [index - d, index + d]) {
        const c = imgs[i];
        if (c && c.complete && c.naturalWidth) {
          img = c;
          break;
        }
      }
    }
    if (!img) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }, []);

  // Pick the film that matches the screen shape.
  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 4/5)");
    const pick = () => setVariant(mq.matches ? "mobile" : "desktop");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  // Load frames: first frame and stations first, then the rest in order.
  useEffect(() => {
    if (!variant) return;
    const urls = variant === "mobile" ? MOBILE : DESKTOP;
    const imgs: HTMLImageElement[] = urls.map(() => new Image());
    imagesRef.current = imgs;
    setLoaded(0);
    let cancelled = false;
    const priority = [0, ...STATIONS.map((s) => s.frame)];
    const order = [...priority, ...urls.map((_, i) => i).filter((i) => !priority.includes(i))];
    let cursor = 0;
    let count = 0;
    const next = () => {
      if (cancelled || cursor >= order.length) return;
      const i = order[cursor++]!;
      const img = imgs[i]!;
      img.decoding = "async";
      const done = () => {
        if (cancelled) return;
        count++;
        setLoaded(count);
        if (Math.abs(i - frameRef.current) <= 2 || i === 0) draw(frameRef.current);
        next();
      };
      img.onload = done;
      img.onerror = done;
      img.src = urls[i]!;
    };
    for (let k = 0; k < 6; k++) next();
    return () => {
      cancelled = true;
    };
  }, [variant, draw]);

  // Size canvas, follow scroll, softly settle on stations.
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    let raf = 0;
    let settle = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw(frameRef.current);
    };
    const metrics = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      return { top: rect.top + window.scrollY, total, p: clamp(-rect.top / total, 0, 1) };
    };
    const update = () => {
      raf = 0;
      const { p } = metrics();
      progress.set(p);
      const f = Math.round(p * LAST);
      if (f !== frameRef.current) {
        frameRef.current = f;
        draw(f);
        setFrame(f);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      window.clearTimeout(settle);
      if (reduced) return;
      settle = window.setTimeout(() => {
        const { top, total, p } = metrics();
        if (p <= 0.005 || p >= 0.995) return;
        const exact = p * LAST;
        const near = STATIONS.filter((s) => s.frame > 0).find((s) => Math.abs(s.frame - exact) <= SNAP_RADIUS);
        if (near && Math.abs(near.frame - exact) > 0.35) {
          window.scrollTo({ top: top + (near.frame / LAST) * total, behavior: "smooth" });
        }
      }, 220);
    };
    resize();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      window.clearTimeout(settle);
      cancelAnimationFrame(raf);
    };
  }, [draw, progress]);

  const jumpToStation = (f: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const total = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (f / LAST) * total, behavior: "smooth" });
  };

  const active: StationId | null =
    STATIONS.find((s) => s.frame > 0 && Math.abs(frame - s.frame) <= STATION_RADIUS)?.id ?? null;
  const current = [...STATIONS].reverse().find((s) => frame >= s.frame - STATION_RADIUS) ?? STATIONS[0];
  const pct = Math.round((loaded / COUNT) * 100);

  return (
    <section id="tour" ref={sectionRef} className="relative h-[620vh]" aria-label="Walk through the shop">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-background">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

        {/* Legibility vignette */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--background)_100%)]"
          style={{ opacity: vignette }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />

        <AnimatePresence>
          {loaded === 0 && (
            <motion.div
              className="absolute inset-0 grid place-items-center bg-background"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col items-center gap-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <Scissors className="h-6 w-6 animate-spin text-brass [animation-duration:2.4s]" />
                Opening the doors
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_52%,oklch(0.12_0.012_168/0.78),transparent_75%)]"
          style={{ opacity: heroOpacity }}
        />
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        >
          <motion.p
            className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <HeroStatus />
          </motion.p>
          <h1 className="font-display text-[clamp(3.5rem,11vw,10rem)] font-light leading-[0.85] tracking-tight drop-shadow-[0_8px_40px_oklch(0_0_0/0.6)]">
            {"Malik’s".split("").map((c, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 60, rotateX: -80 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {c}
              </motion.span>
            ))}
            <br />
            <motion.span
              className="inline-block italic text-brass"
              initial={{ opacity: 0, letterSpacing: "0.4em" }}
              animate={{ opacity: 1, letterSpacing: "-0.01em" }}
              transition={{ delay: 0.75, duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            >
              Barbers
            </motion.span>
          </h1>
          <motion.p
            className="mt-6 max-w-md text-balance text-base text-foreground/80 md:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Sharp fades, clean beards and hot towel shaves in Mulhuddart Village, Dublin 15.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <button
              onClick={() => goTo("book")}
              className="bg-brass shadow-brass group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
            >
              Book a chair <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => jumpToStation(STATIONS[1].frame)}
              className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Walk inside
            </button>
          </motion.div>
          <motion.div
            className="absolute bottom-28 flex flex-col items-center gap-2 font-mono md:bottom-10 text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          >
            Scroll to walk in
            <ArrowDown className="h-4 w-4 text-brass" />
          </motion.div>
        </motion.div>

        {/* Station panels */}
        <AnimatePresence mode="wait">
          {active === "hours" && <StationCard key="hours" side="left" station="hours" />}
          {active === "booking" && <StationCard key="booking" side="right" station="booking" />}
          {active === "pricing" && <StationCard key="pricing" side="left" station="pricing" />}
        </AnimatePresence>

        {/* Station rail */}
        <nav
          aria-label="Walkthrough stations"
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-1 md:flex"
        >
          <div className="absolute bottom-3 right-[11px] top-3 w-px bg-foreground/15">
            <motion.div className="w-px origin-top bg-brass" style={{ height: "100%", scaleY: progress }} />
          </div>
          {STATIONS.map((s) => {
            const on = current.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => jumpToStation(s.frame)}
                className="group relative flex items-center justify-end gap-3 py-2"
                aria-current={on ? "step" : undefined}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.2em] transition-all",
                    on ? "text-foreground opacity-100" : "translate-x-2 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    "relative z-10 grid h-6 w-6 place-items-center rounded-full border transition-all",
                    on ? "border-brass bg-brass/20" : "border-foreground/25 bg-background/60 group-hover:border-brass/60",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full transition-all", on ? "scale-125 bg-brass" : "bg-foreground/40")} />
                </span>
              </button>
            );
          })}
        </nav>

        {/* HUD */}
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 md:left-8 md:right-20">
          <div className="glass flex items-center gap-4 rounded-2xl px-4 py-3">
            <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
              <span className="text-foreground">{String(frame).padStart(3, "0")}</span> / {LAST}
            </div>
            <div className="h-8 w-px bg-foreground/15" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Now at</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="font-display text-lg leading-none"
                >
                  {current.label}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          {loaded < COUNT && loaded > 0 && (
            <div className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:block">
              Loading tour {pct}%
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroStatus() {
  const now = useNow(30000);
  if (!now) return <span>Mulhuddart Village · Dublin 15</span>;
  const s = shopStatus(now);
  return (
    <>
      <LiveDot open={s.open} />
      {s.open ? `Open now · until ${formatClock(s.changeAt)}` : `Closed · opens ${formatClock(s.changeAt)}`}
    </>
  );
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function StationCard({ side, station }: { side: "left" | "right"; station: Exclude<StationId, "entrance"> }) {
  return (
    <motion.aside
      className={cn(
        "glass absolute bottom-24 left-4 right-4 rounded-3xl p-6 md:bottom-auto md:top-1/2 md:w-[380px] md:-translate-y-1/2 md:p-7",
        side === "left" ? "md:left-10 md:right-auto" : "md:left-auto md:right-24",
      )}
      initial={{ opacity: 0, x: side === "left" ? -40 : 40, filter: "blur(12px)", clipPath: "inset(0 0 100% 0 round 24px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)", clipPath: "inset(0 0 0% 0 round 24px)" }}
      exit={{ opacity: 0, x: side === "left" ? -30 : 30, filter: "blur(10px)" }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.07, delayChildren: 0.2 }}>
        {station === "hours" && <HoursStation />}
        {station === "booking" && <BookingStation />}
        {station === "pricing" && <PricingStation />}
      </motion.div>
    </motion.aside>
  );
}

function StationHead({ index, title, icon }: { index: string; title: string; icon: React.ReactNode }) {
  return (
    <motion.div variants={item} className="mb-5 flex items-center justify-between">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Station {index}</div>
        <h2 className="font-display text-3xl leading-tight">{title}</h2>
      </div>
      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-glass-border text-brass">{icon}</div>
    </motion.div>
  );
}

function HoursStation() {
  const now = useNow(30000);
  const s = now ? shopStatus(now) : null;
  return (
    <>
      <StationHead index="01" title="Opening hours" icon={<Clock className="h-5 w-5" />} />
      <motion.ul variants={item} className="space-y-1.5 text-sm">
        {HOURS.map((h, i) => (
          <li
            key={h.day}
            className={cn(
              "flex justify-between rounded-lg px-2 py-1",
              s?.todayIndex === i && "bg-brass/15 text-foreground",
              s?.todayIndex !== i && "text-foreground/75",
            )}
          >
            <span>{h.day}</span>
            <span className="tabular-nums">
              {formatClock(h.open)} – {formatClock(h.close)}
            </span>
          </li>
        ))}
      </motion.ul>
      <motion.button variants={item} onClick={() => goTo("hours")} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brass">
        Live status & quiet times <ArrowRight className="h-4 w-4" />
      </motion.button>
    </>
  );
}

function BookingStation() {
  return (
    <>
      <StationHead index="02" title="Booking" icon={<Phone className="h-5 w-5" />} />
      <motion.p variants={item} className="text-sm text-foreground/75">
        Walk-ins welcome. Want a set time? Pick your service and slot in a few taps, or give us a ring.
      </motion.p>
      <motion.a variants={item} href={telHref} className="mt-4 block font-display text-4xl tracking-tight text-brass">
        {SHOP.phoneDisplay}
      </motion.a>
      <motion.div variants={item} className="mt-5 flex gap-2">
        <button onClick={() => goTo("book")} className="bg-brass flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Start booking
        </button>
        <a href={telHref} className="flex-1 rounded-full border border-glass-border px-4 py-2.5 text-center text-sm font-medium hover:bg-secondary">
          Call now
        </a>
      </motion.div>
    </>
  );
}

function PricingStation() {
  return (
    <>
      <StationHead index="03" title="Pricing" icon={<Scissors className="h-5 w-5" />} />
      <motion.dl variants={item} className="grid gap-y-2 text-sm">
        {SERVICES.map((s) => (
          <div key={s.id} className="flex items-baseline justify-between gap-2 border-b border-foreground/10 pb-1.5">
            <dt className="truncate text-foreground/80">{s.name}</dt>
            <dd className="font-mono text-xs tabular-nums text-brass">{formatEuro(s.price)}</dd>
          </div>
        ))}
      </motion.dl>
      <motion.button variants={item} onClick={() => goTo("services")} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brass">
        Build your package <ArrowRight className="h-4 w-4" />
      </motion.button>
    </>
  );
}
