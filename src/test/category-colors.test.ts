/**
 * Tests for utility functions — Phase 6 additions.
 */

import { describe, it, expect } from "vitest";
import { getCategoryColor } from "../lib/utils";

describe("getCategoryColor", () => {
  it("returns a color for Development", () => {
    const color = getCategoryColor("Development");
    expect(color).toContain("#");
    expect(color).toBe("#2F73F6");
  });

  it("returns a color for Research", () => {
    const color = getCategoryColor("Research");
    expect(color).toContain("#");
    expect(color).toBe("#7845F0");
  });

  it("returns a color for Communication", () => {
    expect(getCategoryColor("Communication")).toBe("#F59E1A");
  });

  it("returns a color for Meetings", () => {
    expect(getCategoryColor("Meetings")).toBe("#28BC6F");
  });

  it("returns a color for Design", () => {
    expect(getCategoryColor("Design")).toBe("#DE31AD");
  });

  it("returns a color for Productivity", () => {
    expect(getCategoryColor("Productivity")).toBe("#199BE6");
  });

  it("returns a color for Entertainment", () => {
    expect(getCategoryColor("Entertainment")).toBe("#EE5C5C");
  });

  it("returns Uncategorized color for unknown category", () => {
    const uncategorized = getCategoryColor("Uncategorized");
    const unknown = getCategoryColor("SomethingRandom");
    expect(unknown).toBe(uncategorized);
  });

  it("returns consistent colors", () => {
    const color1 = getCategoryColor("Development");
    const color2 = getCategoryColor("Development");
    expect(color1).toBe(color2);
  });
});
