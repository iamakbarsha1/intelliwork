/**
 * Tests for utility functions — Phase 6 additions.
 */

import { describe, it, expect } from "vitest";
import { getCategoryColor } from "../lib/utils";

describe("getCategoryColor", () => {
  it("returns a color for Development", () => {
    const color = getCategoryColor("Development");
    expect(color).toContain("hsl");
    expect(color).toContain("220");
  });

  it("returns a color for Research", () => {
    const color = getCategoryColor("Research");
    expect(color).toContain("hsl");
    expect(color).toContain("260");
  });

  it("returns a color for Communication", () => {
    expect(getCategoryColor("Communication")).toContain("hsl");
  });

  it("returns a color for Meetings", () => {
    expect(getCategoryColor("Meetings")).toContain("150");
  });

  it("returns a color for Design", () => {
    expect(getCategoryColor("Design")).toContain("320");
  });

  it("returns a color for Productivity", () => {
    expect(getCategoryColor("Productivity")).toContain("200");
  });

  it("returns a color for Entertainment", () => {
    expect(getCategoryColor("Entertainment")).toContain("hsl");
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
