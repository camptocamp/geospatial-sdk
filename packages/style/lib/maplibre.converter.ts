import type { LayerSpecification } from "maplibre-gl";
import type { FlatStyleLike } from "ol/style/flat.js";
import type { EncodedExpression } from "ol/expr/expression.js";

type OlExpression = [string, ...OlExpression[]];

const OL_TO_MAPLIBRE_OPERATORS: Record<string, string> = {
  number: "to-number",
  string: "to-string",
};

const UNSUPPORTED_OPERATORS = new Set(["band", "palette", "var", "time"]);

function isExpression(value: unknown): value is OlExpression {
  return Array.isArray(value) && typeof value[0] === "string";
}

function convertOlExpression(expr: OlExpression): unknown {
  const [operator, ...args] = expr;

  if (UNSUPPORTED_OPERATORS.has(operator)) {
    console.warn(`Unsupported OL expression operator "${operator}", skipping.`);
    return 0;
  }

  const convertedArgs = args.map((arg) => convertValue(arg));

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

  if (operator === "resolution") {
    // this assumes that the projection is web mercator
    const maxResolutionAtZoom0 = 156543.03392804097;
    return ["/", maxResolutionAtZoom0, ["^", 2, ["zoom"]]];
  }

  const mappedOperator = OL_TO_MAPLIBRE_OPERATORS[operator] ?? operator;
  return [mappedOperator, ...convertedArgs];
}

function convertValue(value: unknown | OlExpression): any {
  if (isExpression(value)) {
    return convertOlExpression(value);
  }
  return value;
}

const defaultOlStrokeColor = "rgb(51,153,204)";
const defaultOlStrokeWidth = 1.25;
const defaultOlCircleFill = "rgba(255,255,255,0.4)";
const defaultOlCircleRadius = 5;

export function openLayersStyleToMapLibreLayers(
  style: FlatStyleLike,
  filter?: EncodedExpression,
): Partial<LayerSpecification>[] {
  const layers: Partial<LayerSpecification>[] = [];

  if (Array.isArray(style)) {
    return style.flatMap((style_) => {
      if ("style" in style_) {
        return openLayersStyleToMapLibreLayers(style_.style, style_.filter);
      }
      return openLayersStyleToMapLibreLayers(style_, filter);
    });
  }

  const commonFilter = filter ?? convertValue(filter);
  const commonFilterAsStr = JSON.stringify(commonFilter);
  const isCommonFilterPointsOnly =
    commonFilterAsStr === JSON.stringify(["==", ["geometry-type"], "Point"]);
  const isCommonFilterPolygonsOnly =
    commonFilterAsStr === JSON.stringify(["==", ["geometry-type"], "Polygon"]);

  if (style["fill-color"]) {
    const layer: Partial<LayerSpecification> = {
      type: "fill",
      paint: {
        "fill-color": convertValue(style["fill-color"]),
      },
    };
    if (commonFilter && !isCommonFilterPolygonsOnly) {
      layer.filter = [
        "all",
        commonFilter,
        ["==", ["geometry-type"], "Polygon"],
      ];
    } else {
      layer.filter = ["==", ["geometry-type"], "Polygon"];
    }
    layers.push(layer);
  }
  if (style["stroke-color"] || style["stroke-width"]) {
    const layer: Partial<LayerSpecification> = {
      type: "line",
      paint: {
        "line-color":
          convertValue(style["stroke-color"]) ?? defaultOlStrokeColor,
        "line-width":
          convertValue(style["stroke-width"]) ?? defaultOlStrokeWidth,
      },
    };
    if (style["stroke-line-dash"]) {
      layer.paint!["line-dasharray"] = convertValue(style["stroke-line-dash"]);
    }
    if (commonFilter) {
      layer.filter = commonFilter;
    }
    layers.push(layer);
  }
  if (
    style["circle-radius"] ||
    style["circle-fill-color"] ||
    style["circle-stroke-color"] ||
    style["circle-stroke-width"]
  ) {
    const layer: Partial<LayerSpecification> = {
      type: "circle",
      paint: {
        "circle-radius":
          convertValue(style["circle-radius"]) ?? defaultOlCircleRadius,
        "circle-color":
          convertValue(style["circle-fill-color"]) ?? defaultOlCircleFill,
      },
    };
    if (style["circle-stroke-color"] || style["circle-stroke-width"]) {
      layer.paint!["circle-stroke-color"] =
        convertValue(style["circle-stroke-color"]) ?? defaultOlStrokeColor;
      layer.paint!["circle-stroke-width"] =
        convertValue(style["circle-stroke-width"]) ?? defaultOlStrokeWidth;
    }
    if (commonFilter && !isCommonFilterPointsOnly) {
      layer.filter = ["all", commonFilter, ["==", ["geometry-type"], "Point"]];
    } else {
      layer.filter = ["==", ["geometry-type"], "Point"];
    }
    layers.push(layer);
  }
  return layers;
}
