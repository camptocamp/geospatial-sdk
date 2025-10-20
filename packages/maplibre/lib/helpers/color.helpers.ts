import chroma from "chroma-js";
import { ColorExpression } from "ol/style/flat";

export interface ColorProps {
  color?: string;
  opacity?: number;
  expression?: any[];
}

export const DEFAULT_COLOR = "black";

export function createColor(input: ColorExpression): ColorProps {
  // Expression
  if (Array.isArray(input) && typeof input[0] === "string") {
    console.warn("Color expressions are not fully supported yet.");
    return { expression: input };
  }

  // Color as Array [red, green, blue, alpha?]
  if (Array.isArray(input) && typeof input[0] === "number") {
    if (input.length === 3) {
      return { color: chroma.rgb(input[0], input[1], input[2]).hex() };
    }
    if (input.length === 4) {
      const [r, g, b, a] = input;
      return {
        color: chroma.rgb(r, g, b).hex(),
        opacity: a,
      };
    }
  }

  // String eg 'black
  if (typeof input === "string") {
    const c = chroma(input);
    const alpha = c.alpha();
    return {
      color: c.hex("rgb"),
      opacity: alpha < 1 ? alpha : undefined,
    };
  }
  return { color: DEFAULT_COLOR };
}

export function colorToRgbaString(color: ColorProps): string | undefined {
  if (color.color === undefined) return undefined;
  if (color.opacity !== undefined) {
    const c = chroma(color.color).alpha(color.opacity);
    return c.css();
  }
  return color.color;
}
