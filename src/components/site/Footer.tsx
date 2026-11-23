import { motion } from "motion/react";
import { SHOP, telHref, HOURS, formatClock } from "@/lib/shop";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-glass-border pt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-3 md:px-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Visit</div>
          <address className="mt-3 not-italic leading-relaxed text-foreground/80">
            {SHOP.addressLines.map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </address>
          <p className="mt-2 text-sm text-muted-foreground">Free parking available at the shop.</p>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Hours</div>
          <ul className="mt-3 space-y-1 text-sm text-foreground/80">
            <li>Mon–Wed · {formatClock(HOURS[0].open)} – {formatClock(HOURS[0].close)}</li>
            <li>Thu–Fri · {formatClock(HOURS[3].open)} – {formatClock(HOURS[3].close)}</li>
            <li>Sat · {formatClock(HOURS[5].open)} – {formatClock(HOURS[5].close)}</li>
            <li>Sun · {formatClock(HOURS[6].open)} – {formatClock(HOURS[6].close)}</li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass">Call</div>
          <a href={telHref} className="mt-3 block font-display text-3xl hover:text-brass">{SHOP.phoneDisplay}</a>
        </div>
      </div>
      <motion.div
        className="mt-16 select-none whitespace-nowrap px-4 text-center font-display text-[clamp(4rem,17vw,16rem)] font-light italic leading-[0.8] text-brass opacity-90"
        initial={{ y: "40%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        aria-hidden="true"
      >
        Malik’s
      </motion.div>
      <div className="mx-auto flex max-w-7xl justify-between px-5 py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:px-8">
        <span>© {new Date().getFullYear()} Malik’s Barbers</span>
        <span>Mulhuddart Village · Dublin 15</span>
      </div>
    </footer>
  );
}
