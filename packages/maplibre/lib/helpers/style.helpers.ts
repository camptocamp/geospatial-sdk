import { VectorStyle } from "@geospatial-sdk/core/dist/model/style.js";
import { LayerSpecification } from "maplibre-gl";
import { FlatFill, FlatStyle, Rule } from "ol/style/flat.js";

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
        "fill-color": (style as FlatFill)["fill-color"] as string,
      },
      filter: ["==", "$type", "Polygon"],
    });
  }
  if (style["stroke-color"] || style["stroke-width"]) {
    layers.push({
      type: "line",
      paint: {
        "line-color": style["stroke-color"] as string,
        ...(style["stroke-width"] !== undefined && {
          "line-width": style["stroke-width"] as number,
        }),
        ...(style["stroke-line-dash"] !== undefined && {
          "line-dasharray": style["stroke-line-dash"],
        }),
      },
    });
  }
  if (style["circle-radius"]) {
    layers.push({
      type: "circle",
      paint: {
        "circle-radius": style["circle-radius"],
        "circle-stroke-color": style["circle-stroke-color"] as string,
        "circle-color": style["circle-fill-color"] as string,
        "circle-stroke-width": style["circle-stroke-width"] as number,
      },
      filter: ["==", "$type", "Point"],
    });
  }
  return layers;
}
