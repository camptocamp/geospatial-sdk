import {
  MapContextLayer,
  MapContextLayerWms,
  MapContextLayerWmts,
  removeSearchParams,
} from "@geospatial-sdk/core";
import { WmtsEndpoint } from "@camptocamp/ogc-client";

/**
 * Configuration options for legend generation.
 */
export interface LegendOptions {
  format?: string;
  widthPxHint?: number;
  heightPxHint?: number;
}

/**
 * A single legend entry for a layer.
 *
 * Currently the only kind is an `"image"` graphic (WMS GetLegendGraphic, WMTS
 * legend URL) that can be rendered directly with an `<img>`.
 *
 * The `type` discriminant is present from the start so vector layers can be
 * added later (e.g. a `"swatch"` entry carrying a `VectorStyle` from
 * `@geospatial-sdk/core`, rendered client-side) without a breaking change to
 * existing consumers.
 */
export interface LegendEntry {
  type: "image";
  url: string;
  label: string;
}

/**
 * Whether a layer type can carry a legend.
 *
 * This is a cheap, type-level check; it does not guarantee that a legend actually
 * exists (a WMTS layer may declare no legend URL). Use it to gate UI, and use the
 * result of {@link createLegendUrlFromLayer} to know whether a graphic is available.
 *
 * @param layer - The layer to check.
 * @returns `true` if the layer is a WMS or WMTS layer with a URL and a name.
 */
export function hasLegendSupport(
  layer: MapContextLayer,
): layer is MapContextLayerWms | MapContextLayerWmts {
  return (
    (layer.type === "wms" || layer.type === "wmts") &&
    !!layer.url &&
    !!layer.name
  );
}

/**
 * Create a legend URL for a WMS layer.
 *
 * @param layer - The MapContextLayer to create a legend URL for.
 * @param options - Optional configuration for legend generation.
 * @returns A URL for the WMS legend graphic.
 */
function createWmsLegendUrl(
  layer: MapContextLayerWms,
  options: LegendOptions = {},
): URL {
  const { format = "image/png", widthPxHint, heightPxHint } = options;

  const legendUrl = new URL(
    removeSearchParams(layer.url, [
      "SERVICE",
      "REQUEST",
      "FORMAT",
      "LAYER",
      "LAYERTITLE",
      "SLD_VERSION",
      "STYLE",
      "WIDTH",
      "HEIGHT",
    ]),
  );
  legendUrl.searchParams.set("SERVICE", "WMS");
  legendUrl.searchParams.set("REQUEST", "GetLegendGraphic");
  legendUrl.searchParams.set("FORMAT", format);
  legendUrl.searchParams.set("LAYER", layer.name);
  legendUrl.searchParams.set("LAYERTITLE", false.toString()); // Disable layer title for QGIS Server
  legendUrl.searchParams.set("SLD_VERSION", "1.1.0"); // Default SLD version
  if (layer.style) {
    legendUrl.searchParams.set("STYLE", layer.style);
  }
  if (widthPxHint) {
    legendUrl.searchParams.set("WIDTH", widthPxHint.toString());
  }
  if (heightPxHint) {
    legendUrl.searchParams.set("HEIGHT", heightPxHint.toString());
  }

  return legendUrl;
}

/**
 * Create a legend URL for a WMTS layer.
 *
 * @param layer - The WMTS layer to create a legend URL for.
 * @returns A URL for the WMTS legend graphic, or `null` if none is declared.
 * @throws If the WMTS endpoint cannot be read or the layer is not found.
 */
async function createWmtsLegendUrl(
  layer: MapContextLayerWmts,
): Promise<string | null> {
  const endpoint = await new WmtsEndpoint(layer.url).isReady();

  const layerByName = endpoint.getLayerByName(layer.name);
  if (!layerByName) {
    throw new Error(
      `WMTS layer "${layer.name}" was not found in the endpoint capabilities`,
    );
  }

  if (layerByName.styles && layerByName.styles.length > 0) {
    // If a specific style is requested, find its legend URL
    if (layer.style) {
      const matchingStyle = layerByName.styles.find(
        (s: { name?: string }) => s.name === layer.style,
      );
      if (matchingStyle?.legendUrl) {
        return matchingStyle.legendUrl;
      }
    }
    // Fall back to the first style's legend URL
    if (layerByName.styles[0].legendUrl) {
      return layerByName.styles[0].legendUrl;
    }
  }

  return null;
}

/**
 * Resolve the legend graphic URL for a raster layer.
 *
 * @param layer - The layer to resolve a legend URL for.
 * @param options - Optional configuration for legend generation.
 * @returns The legend URL, or `null` if the layer declares no legend (e.g. a WMTS
 *   layer whose styles carry no legend URL).
 * @throws If the layer type does not support legends, if it is missing a url or
 *   name, or if resolving the URL fails (e.g. the WMTS GetCapabilities request
 *   fails or the layer is not found).
 */
export async function createLegendUrlFromLayer(
  layer: MapContextLayer,
  options: LegendOptions = {},
): Promise<string | null> {
  if (layer.type !== "wms" && layer.type !== "wmts") {
    throw new Error(
      `Cannot create a legend for a layer of type "${layer.type}"`,
    );
  }
  if (!layer.url || !layer.name) {
    throw new Error(
      `Cannot create a legend for layer "${layer.name}": missing url or name`,
    );
  }

  if (layer.type === "wms") {
    return createWmsLegendUrl(layer, options).toString();
  }

  // Only case left is WMTS
  return createWmtsLegendUrl(layer);
}

/**
 * Build the list of legend entries for a layer.
 *
 * Today this yields at most one `image` entry for WMS/WMTS layers. It returns an
 * array so that multi-style raster layers and (future) vector layers — which
 * produce one entry per style rule — fit without an API change.
 *
 * @param layer - The layer to build legend entries for.
 * @param options - Optional configuration for legend generation.
 * @returns The legend entries, or an empty array if the layer has no legend.
 * @throws If the layer type does not support legends, or if resolving fails.
 */
export async function createLegendEntriesFromLayer(
  layer: MapContextLayer,
  options: LegendOptions = {},
): Promise<LegendEntry[]> {
  const url = await createLegendUrlFromLayer(layer, options);
  if (!url) {
    return [];
  }

  // createLegendUrlFromLayer throws unless the layer is a WMS/WMTS layer with a
  // name, so a non-null url guarantees `layer.name` is present.
  const { name } = layer as MapContextLayerWms | MapContextLayerWmts;
  return [{ type: "image", url, label: name }];
}

/**
 * Build a legend DOM element for a layer.
 *
 * @deprecated This couples the package to the DOM and to its own CSS classes.
 *   Prefer {@link createLegendEntriesFromLayer} (or {@link createLegendUrlFromLayer})
 *   and render the result with your own framework.
 *
 * @param layer - The layer to build a legend element for.
 * @param options - Optional configuration for legend generation.
 * @returns A legend element, or `null` if the layer does not support legends.
 */
export async function createLegendFromLayer(
  layer: MapContextLayer,
  options: LegendOptions = {},
): Promise<HTMLElement | null> {
  if (!hasLegendSupport(layer)) {
    console.error("Invalid layer for legend creation");
    return null;
  }

  const legendDiv = document.createElement("div");
  legendDiv.id = "legend";
  legendDiv.setAttribute("role", "region");
  legendDiv.setAttribute("aria-label", "Map Layer Legend");
  legendDiv.classList.add("geosdk--legend-container");

  const layerDiv = document.createElement("div");
  layerDiv.classList.add("geosdk--legend-layer");

  const layerTitle = document.createElement("h4");
  layerTitle.textContent = layer.name;
  layerTitle.classList.add("geosdk--legend-layer-label");
  layerDiv.appendChild(layerTitle);

  const img = document.createElement("img");
  img.alt = `Legend for ${layer.name}`;
  img.classList.add("geosdk--legend-layer-image");

  img.onerror = (e) => {
    console.warn(`Failed to load legend for layer: ${layer.name}`, e);
    const errorMessage = document.createElement("span");
    errorMessage.textContent = `Legend not available for ${layer.name}`;
    layerDiv.replaceChild(errorMessage, img);
  };

  try {
    const legendUrl = await createLegendUrlFromLayer(layer, options);
    if (legendUrl) {
      img.src = legendUrl;
      layerDiv.appendChild(img);
    } else {
      const errorMessage = document.createElement("span");
      errorMessage.textContent = `Legend not available for ${layer.name}`;
      layerDiv.appendChild(errorMessage);
    }
  } catch (error) {
    console.error(`Error creating legend for layer ${layer.name}:`, error);
    const errorMessage = document.createElement("span");
    errorMessage.textContent = `Error loading legend for ${layer.name}`;
    layerDiv.appendChild(errorMessage);
  }

  legendDiv.appendChild(layerDiv);
  return legendDiv;
}
