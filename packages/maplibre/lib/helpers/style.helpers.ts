import { VectorStyle } from "@geospatial-sdk/core/dist/model/style";
import { createColor, defaultFillColor } from "./color.helpers";
import { LayerSpecification } from "maplibre-gl";

const flatStyle: VectorStyle = {
  "fill-color": defaultFillColor,
  "stroke-color": "#3399CC",
  "stroke-width": 1.25,
  "circle-radius": 5,
  "circle-fill-color": "rgba(255,255,255,0.4)",
  "circle-stroke-width": 1.25,
  "circle-stroke-color": "#3399CC",
};

export function contextStyleToMaplibreLayers(style: VectorStyle): Partial<LayerSpecification>[] {
  const layers: Partial<LayerSpecification>[] = [];

  if (Array.isArray(style)) {
    return style.flatMap((style_) => {
      if (style_.hasOwnProperty('style')) {
        console.warn('Rules in styles are not supported yet.');
        return contextStyleToMaplibreLayers((style_ as any).style);
      }
      return contextStyleToMaplibreLayers(style_ as any);
    });
  }

  if (style["fill-color"]) {
    const colorProps = createColor(style["fill-color"]);
    layers.push({
      type: "fill",
      paint: {
        "fill-color": colorProps.color,
        ...(colorProps.opacity !== undefined && {
          "fill-opacity": colorProps.opacity,
        }),
      },
    });
  }
  if (style["stroke-color"] || style["stroke-width"]) {
    let colorProps;
    if (style["stroke-color"]) {
      colorProps = createColor(style["stroke-color"]);
    }
    layers.push({
      type: "line",
      paint: {
        ...(colorProps?.opacity !== undefined && {
          "line-opacity": colorProps.opacity,
        }),
        ...(colorProps?.color !== undefined && {
          "line-color": colorProps.color,
        }),
        ...(style["stroke-width"] !== undefined && {
          "line-width": style["stroke-width"],
        }),
        ...(style["stroke-line-dash"] !== undefined && {
          "line-dasharray": style["stroke-line-dash"],
        }),
      },
    } as LayerSpecification); // fixme

  }
  if (style["circle-radius"]) {
    let fillColorPropsProps, strokeColorProps;
    if (style["circle-fill-color"]) {
      fillColorPropsProps = createColor(style["circle-fill-color"]);
    }
    if (style["circle-stroke-color"]) {
      strokeColorProps = createColor(style["circle-stroke-color"]);
    }
    layers.push({
      type: "circle",
      paint: {
        "circle-radius": style["circle-radius"],
        ...(fillColorPropsProps?.opacity !== undefined && {
          "circle-opacity": fillColorPropsProps.opacity,
        }),
        ...(fillColorPropsProps?.color !== undefined && {
          "circle-color": fillColorPropsProps.color,
        }),
        ...(strokeColorProps?.opacity !== undefined && {
          "circle-stroke-opacity": strokeColorProps.opacity,
        }),
        ...(strokeColorProps?.color !== undefined && {
          "circle-stroke-color": strokeColorProps.color,
        }),
        "circle-stroke-width": style["circle-stroke-width"] as number,
      },
    });
  }

  return layers;
}
