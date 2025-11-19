import { describe, it, expect } from "vitest";
import { createColor, DEFAULT_COLOR } from "./color.helpers";

describe("createColor", () => {
  it("returns default color if input is null/undefined", () => {
    expect(createColor(undefined as any)).toEqual({ color: DEFAULT_COLOR });
    expect(createColor(null as any)).toEqual({ color: DEFAULT_COLOR });
  });

  it("returns an expression if input is an expression", () => {
    const expr = ["get", "color"];
    const result = createColor(expr as any);
    expect(result).toEqual({ expression: expr });
  });

  it("converts RGB array to hex", () => {
    const result = createColor([255, 0, 0]);
    expect(result).toEqual({ color: "rgb(255,0,0)" });
  });

  it("conVerts RGB array to hex + opacity", () => {
    const result = createColor([0, 255, 0, 0.5]);
    expect(result).toEqual({
      color: "rgb(0,255,0)",
      opacity: 0.5,
    });
  });

  it("converts a named CSS color", () => {
    const result = createColor("blue");
    expect(result.color).toBe("blue");
    expect(result.opacity).toBeUndefined();
  });

  it("converts an hex CSS color without alpha", () => {
    const result = createColor("#ff00ff");
    expect(result.color).toEqual("#ff00ff");
    expect(result.opacity).toBeUndefined();
  });

  it("converts a RGB color with alpha", () => {
    const result = createColor("rgba(255, 255, 0, 0.25)");
    expect(result.color).toEqual("#ffff00");
    expect(result.opacity).toBeCloseTo(0.25);
  });

  it("no opacity if alpha chanel is 1", () => {
    const result = createColor("rgba(10, 20, 30, 1)");
    expect(result.color).toEqual("#0a141e");
    expect(result.opacity).toBeUndefined();
  });

  it("returns default color if input is not valid", () => {
    expect(createColor(123 as any)).toEqual({ color: DEFAULT_COLOR });
    expect(createColor({} as any)).toEqual({ color: DEFAULT_COLOR });
  });
});
