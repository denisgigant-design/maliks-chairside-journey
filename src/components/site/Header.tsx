import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Phone } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { telHref } from "@/lib/shop";
import { HexMark } from "./ui";

const LINKS = [
  { id: "tour", label: "Tour" },
  { id: "services", label: "Services" },
  { id: "hours", label: "Hours" },
  { id: "book", label: "Book" },
];

export function Header() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(v > 40);
    setHidden(v > 400 && v > prev + 4);
    if (v < prev - 4) setHidden(false);
  });
  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6"
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className={cn("mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500", solid ? "glass" : "bg-transparent")}>
        <a href="#tour" className="flex items-center gap-2.5">
          <HexMark className="h-8 w-8 text-brass" />
          <span className="font-display text-xl leading-none">
            Malik’s <em className="text-brass">Barbers</em>
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="group relative rounded-full px-4 py-2 text-sm text-foreground/75 transition-colors hover:text-foreground">
              {l.label}
              <span className="absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-brass transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>
        <a href={telHref} className="bg-brass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Call</span>
        </a>
      </div>
    </motion.header>
  );
}
