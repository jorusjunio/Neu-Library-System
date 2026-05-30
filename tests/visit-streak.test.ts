import assert from "node:assert/strict";
import test from "node:test";
import { getNextVisitStreak } from "../src/lib/visit-streak";

test("starts a first visit streak at one", () => {
  assert.equal(getNextVisitStreak(null, 0, new Date("2026-05-30T01:00:00.000Z")), 1);
});

test("keeps the same streak for another visit on the same Manila day", () => {
  const lastVisit = new Date("2026-05-29T18:00:00.000Z");
  const now = new Date("2026-05-29T23:00:00.000Z");

  assert.equal(getNextVisitStreak(lastVisit, 4, now), 4);
});

test("increments the streak for consecutive Manila calendar days", () => {
  const lastVisit = new Date("2026-05-29T10:00:00.000Z");
  const now = new Date("2026-05-30T02:00:00.000Z");

  assert.equal(getNextVisitStreak(lastVisit, 4, now), 5);
});

test("resets the streak after a missed Manila calendar day", () => {
  const lastVisit = new Date("2026-05-27T10:00:00.000Z");
  const now = new Date("2026-05-30T02:00:00.000Z");

  assert.equal(getNextVisitStreak(lastVisit, 4, now), 1);
});
