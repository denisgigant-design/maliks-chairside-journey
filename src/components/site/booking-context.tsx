import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type BookingCtx = {
  selected: string[];
  toggle: (id: string) => void;
  setSelected: (ids: string[]) => void;
  /** Hands the current selection to the booking flow and scrolls to it. */
  startBooking: () => void;
  bookingNonce: number;
};

const Ctx = createContext<BookingCtx | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>(["skin-fade"]);
  const [bookingNonce, setNonce] = useState(0);
  const toggle = useCallback(
    (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
    [],
  );
  const startBooking = useCallback(() => {
    setNonce((n) => n + 1);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const value = useMemo(
    () => ({ selected, toggle, setSelected, startBooking, bookingNonce }),
    [selected, toggle, startBooking, bookingNonce],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooking() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBooking must be used inside BookingProvider");
  return v;
}
