import { useEffect, useState } from "react";

/** Current time, ticking every `interval` ms. Null until mounted to avoid hydration mismatches. */
export function useNow(interval = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), interval);
    return () => window.clearInterval(id);
  }, [interval]);
  return now;
}
