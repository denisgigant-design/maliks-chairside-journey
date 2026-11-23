/** Malik's Barbers business data and pure rules (prices, hours, slots, packages). */

export const SHOP = {
  name: "Malik’s Barbers",
  phoneDisplay: "089 955 9209",
  phoneE164: "+353899559209",
  addressLines: ["Unit 3A, Riverpark View", "Mulhuddart Village, Dublin 15", "D15 DY09"],
  addressQuery: "Unit 3A, Riverpark View, Mulhuddart Village, Dublin 15, D15 DY09",
  timeZone: "Europe/Dublin",
} as const;

export type Category = "cuts" | "beards" | "combos" | "treatments";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "cuts", label: "Cuts" },
  { id: "beards", label: "Beards" },
  { id: "combos", label: "Combos" },
  { id: "treatments", label: "Treatments" },
];

export type Service = {
  id: string;
  name: string;
  category: Category;
  /** Price in euro cents. */
  price: number;
  /** Approximate chair time in minutes. */
  minutes: number;
  blurb: string;
};

export const SERVICES: Service[] = [
  { id: "dry-cut", name: "Dry Cut", category: "cuts", price: 2050, minutes: 30, blurb: "Clean scissor and clipper work, finished sharp." },
  { id: "skin-fade", name: "Skin Fade", category: "cuts", price: 2250, minutes: 40, blurb: "Blended right down to the skin, any height you like." },
  { id: "kids-cut", name: "Dry Kid’s Cut", category: "cuts", price: 1850, minutes: 25, blurb: "Patient, quick and tidy for the younger ones." },
  { id: "beard-trim", name: "Beard Trim", category: "beards", price: 1250, minutes: 15, blurb: "Shaped, lined up and balanced to your face." },
  { id: "hot-towel", name: "Hot Towel Shave", category: "beards", price: 2550, minutes: 30, blurb: "Hot towels, a close blade shave and a calm finish." },
  { id: "cut-beard", name: "Haircut & Beard", category: "combos", price: 2550, minutes: 45, blurb: "The full refresh — cut and beard in one sitting." },
  { id: "cut-colour", name: "Haircut & Colour", category: "combos", price: 4050, minutes: 75, blurb: "A fresh cut with colour applied by the chair." },
  { id: "mask-wax", name: "Face Mask & Wax", category: "treatments", price: 1050, minutes: 15, blurb: "Deep-clean mask plus nose and ear wax." },
];

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);

export const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
};

/** Monday-first. Times are minutes after midnight, Dublin time. */
export const HOURS = [
  { day: "Monday", short: "Mon", open: 600, close: 1140 },
  { day: "Tuesday", short: "Tue", open: 600, close: 1140 },
  { day: "Wednesday", short: "Wed", open: 600, close: 1140 },
  { day: "Thursday", short: "Thu", open: 600, close: 1200 },
  { day: "Friday", short: "Fri", open: 600, close: 1200 },
  { day: "Saturday", short: "Sat", open: 540, close: 1140 },
  { day: "Sunday", short: "Sun", open: 600, close: 1080 },
] as const;

export const hoursFor = (dayIndex: number) => HOURS[((dayIndex % 7) + 7) % 7]!;

export const formatClock = (minutes: number) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
};

export const format24 = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Current Dublin wall-clock parts. dayIndex: 0 = Monday. */
export function dublinParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP.timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const dayIndex = Math.max(0, WEEKDAYS.indexOf(get("weekday")));
  return {
    dayIndex,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    seconds: Number(get("second")),
  };
}

export type ShopStatus = {
  open: boolean;
  /** Seconds until the shop closes (when open) or next opens (when closed). */
  secondsUntilChange: number;
  /** Day index of the next opening (when closed) or today (when open). */
  changeDayIndex: number;
  changeAt: number;
  todayIndex: number;
};

export function shopStatus(date: Date): ShopStatus {
  const p = dublinParts(date);
  const nowSec = p.minutes * 60 + p.seconds;
  const today = hoursFor(p.dayIndex);
  if (nowSec >= today.open * 60 && nowSec < today.close * 60) {
    return { open: true, secondsUntilChange: today.close * 60 - nowSec, changeDayIndex: p.dayIndex, changeAt: today.close, todayIndex: p.dayIndex };
  }
  if (nowSec < today.open * 60) {
    return { open: false, secondsUntilChange: today.open * 60 - nowSec, changeDayIndex: p.dayIndex, changeAt: today.open, todayIndex: p.dayIndex };
  }
  const next = (p.dayIndex + 1) % 7;
  const nextHours = hoursFor(next);
  return {
    open: false,
    secondsUntilChange: 24 * 3600 - nowSec + nextHours.open * 60,
    changeDayIndex: next,
    changeAt: nextHours.open,
    todayIndex: p.dayIndex,
  };
}

/**
 * Typical footfall (0–1) per hour. An estimate of a usual week, not live data:
 * lunchtime and after-work peaks on weekdays, a busy Saturday, a gentle Sunday.
 */
export function busyness(dayIndex: number, hour: number): number {
  const h = hoursFor(dayIndex);
  if (hour * 60 < h.open || hour * 60 >= h.close) return 0;
  const bump = (center: number, width: number, height: number) =>
    height * Math.exp(-((hour - center) ** 2) / (2 * width * width));
  let v: number;
  if (dayIndex === 5) v = 0.45 + bump(12, 2.5, 0.5);
  else if (dayIndex === 6) v = 0.25 + bump(13, 2, 0.35);
  else v = 0.18 + bump(13, 1, 0.3) + bump(17.5, 1.3, dayIndex >= 3 ? 0.65 : 0.5);
  return Math.min(1, Math.round(v * 100) / 100);
}

export const busyLabel = (v: number) => (v >= 0.7 ? "Peak" : v >= 0.45 ? "Steady" : "Quiet");

export const CHAIRS = 4;

/** Estimated free chairs for a given hour, derived from typical footfall. */
export const chairsFree = (dayIndex: number, hour: number) => {
  const b = busyness(dayIndex, hour);
  if (b === 0) return 0;
  return Math.max(0, Math.min(CHAIRS, Math.round(CHAIRS * (1 - b))));
};

/** Bookable start times for a day, every `step` minutes, so the visit ends by closing. */
export function slotsFor(dayIndex: number, durationMinutes: number, step = 30, notBefore = -1): number[] {
  const h = hoursFor(dayIndex);
  const out: number[] = [];
  for (let t = h.open; t + durationMinutes <= h.close; t += step) {
    if (t > notBefore) out.push(t);
  }
  return out;
}

export type PackageSummary = {
  items: Service[];
  totalPrice: number;
  totalMinutes: number;
  suggestion: null | { replace: string[]; withId: string; saving: number };
};

/** Totals a selection and points out when an existing combo is cheaper. */
export function summarisePackage(ids: string[]): PackageSummary {
  const items = ids.map(serviceById).filter((s): s is Service => Boolean(s));
  const totalPrice = items.reduce((a, s) => a + s.price, 0);
  const totalMinutes = items.reduce((a, s) => a + s.minutes, 0);
  let suggestion: PackageSummary["suggestion"] = null;
  if (ids.includes("dry-cut") && ids.includes("beard-trim")) {
    const combo = serviceById("cut-beard")!;
    const separate = 2050 + 1250;
    suggestion = { replace: ["dry-cut", "beard-trim"], withId: combo.id, saving: separate - combo.price };
  }
  return { items, totalPrice, totalMinutes, suggestion };
}

/** The next `count` calendar days in Dublin starting today. */
export function upcomingDays(date: Date, count = 7) {
  const p = dublinParts(date);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(p.year, p.month - 1, p.day + i));
    const dayIndex = (p.dayIndex + i) % 7;
    return {
      key: d.toISOString().slice(0, 10),
      dayIndex,
      offset: i,
      weekday: HOURS[dayIndex]!.short,
      dateLabel: d.toLocaleDateString("en-IE", { day: "numeric", month: "short", timeZone: "UTC" }),
      longLabel: d.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
    };
  });
}

export function bookingMessage(opts: { serviceIds: string[]; dayLabel: string; time: number; name: string; note: string }) {
  const s = summarisePackage(opts.serviceIds);
  const lines = [
    `Hi Malik’s Barbers, I’d like to book:`,
    `${s.items.map((i) => i.name).join(" + ")} (${formatEuro(s.totalPrice)}, about ${formatMinutes(s.totalMinutes)})`,
    `${opts.dayLabel} at ${formatClock(opts.time)}`,
  ];
  if (opts.name.trim()) lines.push(`Name: ${opts.name.trim()}`);
  if (opts.note.trim()) lines.push(`Note: ${opts.note.trim()}`);
  return lines.join("\n");
}

export const smsHref = (body: string) => `sms:${SHOP.phoneE164}?body=${encodeURIComponent(body)}`;
export const telHref = `tel:${SHOP.phoneE164}`;
export const directionsHref = (mode: "driving" | "transit" | "walking" | "bicycling") =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SHOP.addressQuery)}&travelmode=${mode}`;
