import { VectorStyle } from "@geospatial-sdk/core";
import { LayerSpecification } from "maplibre-gl";
import { FlatStyle, Rule } from "ol/style/flat.js";

const OL_TO_MAPLIBRE_OPERATORS: Record<string, string> = {
  number: "to-number",
  string: "to-string",
};

const UNSUPPORTED_OPERATORS = new Set([
  "resolution",
  "time",
  "band",
  "palette",
]);

function isExpression(value: unknown): value is any[] {
  return Array.isArray(value) && typeof value[0] === "string";
}

function convertOlExpression(expr: any[]): any {
  const [operator, ...args] = expr;

  if (UNSUPPORTED_OPERATORS.has(operator)) {
    console.warn(`Unsupported OL expression operator "${operator}", skipping.`);
    return undefined;
  }

  const convertedArgs = args.map((arg: any) => convertValue(arg));

  if (operator === "between") {
    const [val, min, max] = convertedArgs;
    return ["all", [">=", val, min], ["<=", val, max]];
  }

  if (operator === "clamp") {
    const [val, low, high] = convertedArgs;
    return ["max", low, ["min", high, val]];
  }

  if (operator === "color") {
    if (convertedArgs.length === 4) {
      return ["rgba", ...convertedArgs];
    }
    return ["rgb", ...convertedArgs];
  }

  const mappedOperator = OL_TO_MAPLIBRE_OPERATORS[operator] ?? operator;
  return [mappedOperator, ...convertedArgs];
}

function convertValue(value: unknown): any {
  if (isExpression(value)) {
    return convertOlExpression(value);
  }
  return value;
}

const defaultOltStyle: FlatStyle = {
  "fill-color": "rgba(255,255,255,0.4)",
  "stroke-color": "#3399CC",
  "stroke-width": 1.25,
  "circle-radius": 5,
  "circle-fill-color": "rgba(255,255,255,0.4)",
  "circle-stroke-width": 1.25,
  "circle-stroke-color": "#3399CC",
};

export function contextStyleToMaplibreLayers(
  style: VectorStyle = {},
): Partial<LayerSpecification>[] {
  const layers: Partial<LayerSpecification>[] = [];

  if (Array.isArray(style)) {
    return style.flatMap((style_) => {
      if (style_.hasOwnProperty("style")) {
        console.warn("Rules in styles are not supported yet.");
        return contextStyleToMaplibreLayers((style_ as Rule).style);
      }
      return contextStyleToMaplibreLayers(style_ as any);
    });
  }

  style = { ...defaultOltStyle, ...style };

  if (style["fill-color"]) {
    layers.push({
      type: "fill",
      paint: {
        "fill-color": convertValue(style["fill-color"]),
      },
      filter: ["==", "$type", "Polygon"],
    });
  }
  if (style["stroke-color"] || style["stroke-width"]) {
    layers.push({
      type: "line",
      paint: {
        "line-color": convertValue(style["stroke-color"]),
        ...(style["stroke-width"] !== undefined && {
          "line-width": convertValue(style["stroke-width"]),
        }),
        ...(style["stroke-line-dash"] !== undefined && {
          "line-dasharray": convertValue(style["stroke-line-dash"]),
        }),
      },
    });
  }
  if (style["circle-radius"]) {
    layers.push({
      type: "circle",
      paint: {
        "circle-radius": convertValue(style["circle-radius"]),
        "circle-stroke-color": convertValue(style["circle-stroke-color"]),
        "circle-color": convertValue(style["circle-fill-color"]),
        "circle-stroke-width": convertValue(style["circle-stroke-width"]),
      },
      filter: ["==", "$type", "Point"],
    });
  }
  return layers;
}
