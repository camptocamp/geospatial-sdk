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
      return { color: `rgb(${input[0]},${input[1]},${input[2]})` };
    }
    if (input.length === 4) {
      const [r, g, b, a] = input;
      return {
        color: `rgb(${r},${g},${b})`,
        opacity: a,
      };
    }
  }

  // String eg 'black
  if (typeof input === "string") {
    return {
      color: input,
    };
  }

  return { color: DEFAULT_COLOR };
}
