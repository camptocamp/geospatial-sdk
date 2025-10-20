import { describe, it, expect } from "vitest";
import chroma from "chroma-js";
import { createColor, DEFAULT_COLOR, colorToRgbaString } from "./color.helpers";

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
    expect(result).toEqual({ color: chroma.rgb(255, 0, 0).hex() });
    expect(result.color).toEqual("#ff0000");
  });

  it("conVerts RGB array to hex + opacity", () => {
    const result = createColor([0, 255, 0, 0.5]);
    expect(result).toEqual({
      color: chroma.rgb(0, 255, 0).hex(),
      opacity: 0.5,
    });
    expect(result.color).toEqual("#00ff00");
    expect(result.opacity).toBeCloseTo(0.5);
  });

  it("converts a named CSS color", () => {
    const result = createColor("blue");
    expect(result.color).toBe(chroma("blue").hex());
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

describe("colorToRgbaString", () => {
  it("returns undefined if color is undefined", () => {
    expect(colorToRgbaString({})).toBeUndefined();
    expect(colorToRgbaString({ opacity: 0.5 })).toBeUndefined();
  });

  it("returns hex color if opacity is undefined", () => {
    expect(colorToRgbaString({ color: "#ff0000" })).toBe("#ff0000");
    expect(colorToRgbaString({ color: "#00ff00", opacity: undefined })).toBe(
      "#00ff00",
    );
  });

  it("returns rgba string if opacity is defined", () => {
    expect(colorToRgbaString({ color: "#ff0000", opacity: 0.5 })).toBe(
      "rgba(255,0,0,0.5)",
    );
    expect(colorToRgbaString({ color: "#00ff00", opacity: 0.25 })).toBe(
      "rgba(0,255,0,0.25)",
    );
  });

  it("handles named colors with opacity", () => {
    expect(colorToRgbaString({ color: "blue", opacity: 0.2 })).toBe(
      "rgba(0,0,255,0.2)",
    );
  });

  it("handles named colors without opacity", () => {
    expect(colorToRgbaString({ color: "blue" })).toBe("blue");
  });
});
