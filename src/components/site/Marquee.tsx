import { HexMark } from "./ui";

const WORDS = ["Skin fades", "Beard sculpting", "Hot towel shaves", "Kids’ cuts", "Colour", "Face masks", "Walk-ins welcome"];

export function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative overflow-hidden border-y border-glass-border bg-card/40 py-6" aria-hidden="true">
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-3xl italic text-foreground/80 md:text-5xl">
            {w}
            <HexMark className="h-6 w-6 text-brass md:h-8 md:w-8" />
          </span>
        ))}
      </div>
    </div>
  );
}
