import { Circle, Fill, Stroke, Style } from "ol/style";
import { StyleFunction } from "ol/style/Style";
import { FeatureLike } from "ol/Feature";
import chroma from "chroma-js";

export interface CreateStyleOptions {
  color: string;
  isFocused?: boolean;
}

export type StyleByGeometryType = {
  line: Style | Style[];
  polygon: Style | Style[];
  point: Style | Style[];
};

export function createGeometryStyles(
  options: CreateStyleOptions,
): StyleByGeometryType {
  const { color, isFocused } = options;
  const zIndex = isFocused ? 10 : undefined;
  return {
    polygon: new Style({
      fill: new Fill({
        color: computeTransparentFillColor(color),
      }),
      stroke: new Stroke({
        color: "white",
        width: 2,
      }),
      zIndex,
    }),
    point: new Style({
      image: new Circle({
        fill: new Fill({
          color,
        }),
        stroke: new Stroke({
          color: "white",
          width: isFocused ? 3 : 2,
        }),
        radius: isFocused ? 8 : 7,
      }),
      zIndex,
    }),
    line: [
      new Style({
        stroke: new Stroke({
          color: "white",
          width: isFocused ? 8 : 6,
        }),
        zIndex,
      }),
      new Style({
        stroke: new Stroke({
          color,
          width: isFocused ? 3 : 2,
        }),
        zIndex,
      }),
    ],
  };
}

export function createStyleFunction(
  styleByGeometryType: StyleByGeometryType,
): StyleFunction {
  return (feature: FeatureLike): Style | Style[] => {
    const geometryType = feature?.getGeometry()?.getType();
    switch (geometryType) {
      case "LinearRing":
      case "LineString":
      case "MultiLineString":
        return styleByGeometryType.line;
      case "Point":
      case "MultiPoint":
        return styleByGeometryType.point;
      case "Circle":
      case "Polygon":
      case "MultiPolygon":
        return styleByGeometryType.polygon;
      default:
        return styleByGeometryType.point;
    }
  };
}

function computeTransparentFillColor(color: string, alpha = 0.25): string {
  return chroma(color).alpha(alpha).css();
}

export const defaultStyle = createStyleFunction(
  createGeometryStyles({
    color: "blue",
  }),
);

export const defaultHighlightStyle = createStyleFunction(
  createGeometryStyles({
    color: "red",
    isFocused: true,
  }),
);
