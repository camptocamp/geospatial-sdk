import { VectorStyle } from "@geospatial-sdk/core/dist/model/style";
import chroma from "chroma-js";
import { ColorExpression } from "ol/style/flat";

interface ColorProps {
  color?: string;
  opacity?: number;
  expression?: any[];
}

export const defaultFillColor = "rgba(255,255,255,0.4)";

export function createColor(input: ColorExpression): ColorProps {
  if (!input) return { color: defaultFillColor };

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

  // String CSS, eg 'black
  if (typeof input === "string") {
    const c = chroma(input);
    const alpha = c.alpha();
    return {
      color: c.hex("rgb"),
      opacity: alpha < 1 ? alpha : undefined,
    };
  }
  return { color: defaultFillColor };
}
