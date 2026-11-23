import { describe, expect, it } from "vitest";
import { shopStatus, slotsFor, summarisePackage, hoursFor, formatEuro, SERVICES, chairsFree, CHAIRS } from "./shop";

// Dublin is UTC+0 in late November.
describe("shop rules", () => {
  it("lists the eight prices from the original site", () => {
    const byName = Object.fromEntries(SERVICES.map((s) => [s.name, formatEuro(s.price)]));
    expect(byName).toEqual({
      "Dry Cut": "€20.50",
      "Skin Fade": "€22.50",
      "Haircut & Beard": "€25.50",
      "Dry Kid’s Cut": "€18.50",
      "Beard Trim": "€12.50",
      "Face Mask & Wax": "€10.50",
      "Hot Towel Shave": "€25.50",
      "Haircut & Colour": "€40.50",
    });
  });

  it("keeps the opening hours: Thu 10–8, Sat 9–7, Sun 10–6", () => {
    expect(hoursFor(3)).toMatchObject({ open: 600, close: 1200 });
    expect(hoursFor(5)).toMatchObject({ open: 540, close: 1140 });
    expect(hoursFor(6)).toMatchObject({ open: 600, close: 1080 });
  });

  it("is open on Monday at 11:50 with 7h10m until 7pm closing", () => {
    const s = shopStatus(new Date("2026-11-23T11:50:00Z"));
    expect(s.open).toBe(true);
    expect(s.secondsUntilChange).toBe((7 * 60 + 10) * 60);
  });

  it("is closed on Saturday at 8:00 and opens at 9am in one hour", () => {
    const s = shopStatus(new Date("2026-11-28T08:00:00Z"));
    expect(s.open).toBe(false);
    expect(s.changeAt).toBe(540);
    expect(s.secondsUntilChange).toBe(3600);
  });

  it("after Sunday 6pm, next opening is Monday 10am", () => {
    const s = shopStatus(new Date("2026-11-29T19:00:00Z"));
    expect(s.open).toBe(false);
    expect(s.changeDayIndex).toBe(0);
    expect(s.secondsUntilChange).toBe(15 * 3600);
  });

  it("offers Sunday slots for a 30 min visit from 10:00 to 17:30", () => {
    const slots = slotsFor(6, 30);
    expect(slots[0]).toBe(600);
    expect(slots.at(-1)).toBe(1050);
  });

  it("totals Skin Fade + Hot Towel Shave to €48.00 and 70 min", () => {
    const p = summarisePackage(["skin-fade", "hot-towel"]);
    expect(p.totalPrice).toBe(4800);
    expect(p.totalMinutes).toBe(70);
    expect(p.suggestion).toBeNull();
  });

  it("suggests Haircut & Beard saving €7.50 over Dry Cut + Beard Trim", () => {
    const p = summarisePackage(["dry-cut", "beard-trim"]);
    expect(p.totalPrice).toBe(3300);
    expect(p.suggestion?.withId).toBe("cut-beard");
    expect(p.suggestion?.saving).toBe(750);
  });

  it("never estimates more free chairs than the shop has, and none when closed", () => {
    expect(chairsFree(0, 8)).toBe(0);
    for (let h = 9; h < 20; h++) expect(chairsFree(4, h)).toBeLessThanOrEqual(CHAIRS);
  });
});
