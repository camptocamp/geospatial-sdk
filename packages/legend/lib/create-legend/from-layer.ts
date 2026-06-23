import {
  MapContextLayer,
  MapContextLayerWms,
  MapContextLayerWmts,
  removeSearchParams,
} from "@geospatial-sdk/core";
import { WmsEndpoint, WmtsEndpoint } from "@camptocamp/ogc-client";

/**
 * Configuration options for legend generation
 */
interface LegendOptions {
  format?: string;
  widthPxHint?: number;
  heightPxHint?: number;
}

/**
 * Pick the legend URL advertised for a layer's styles in the service
 * capabilities, preferring the requested style.
 *
 * When a specific style is requested but no matching style advertises a legend,
 * `fallbackToFirstStyle` decides whether to use the first advertised legend
 * (the best a WMTS layer can do) or to give up so the caller can honour the
 * requested style another way (a WMS `GetLegendGraphic&STYLE=...` request).
 *
 * @param styles - The styles advertised for the layer.
 * @param requestedStyle - The style requested on the layer, if any.
 * @param fallbackToFirstStyle - Use the first style's legend when the requested
 *   style has none. Defaults to `true`.
 * @returns The advertised legend URL, or `null` if none is available.
 */
function findStyleLegendUrl(
  styles: { name?: string; legendUrl?: string }[] | undefined,
  requestedStyle?: string,
  fallbackToFirstStyle = true,
): string | null {
  if (!styles || styles.length === 0) {
    return null;
  }

  if (requestedStyle) {
    const matchingStyle = styles.find((s) => s.name === requestedStyle);
    if (matchingStyle?.legendUrl) {
      return matchingStyle.legendUrl;
    }

    if (!fallbackToFirstStyle) {
      return null;
    }
  }

  return styles[0].legendUrl ?? null;
}

/**
 * Whether a layer type can carry a legend.
 *
 * This is a cheap, type-level check; it does not guarantee that a legend actually
 * exists (a WMTS layer may declare no legend URL). Use it to gate UI, and use the
 * result of {@link createLegendFromLayer} to know whether a graphic is available.
 *
 * @param layer - The layer to check.
 * @returns `true` if the layer is a WMS or WMTS layer.
 */
export function hasLegendSupport(
  layer: MapContextLayer,
): layer is MapContextLayerWms | MapContextLayerWmts {
  return layer.type === "wms" || layer.type === "wmts";
}

/**
 * Create a legend URL for a WMS layer.
 *
 * Prefers the legend advertised in the service capabilities (the canonical,
 * styled graphic), the same way the WMTS path does. Falls back to building a
 * `GetLegendGraphic` request only when capabilities advertise no legend (e.g.
 * QGIS Server) or cannot be read. This matters for servers such as the IGN
 * Géoplateforme, which advertise a static `LegendURL` and reject
 * `GetLegendGraphic` requests outright.
 *
 * @param layer - The MapContextLayer to create a legend URL for
 * @param options - Optional configuration for legend generation
 * @returns A URL for the WMS legend graphic, or `null` if none is available
 */
async function createWmsLegendUrl(
  layer: MapContextLayerWms,
  options: LegendOptions = {},
): Promise<string | null> {
  try {
    const endpoint = await new WmsEndpoint(layer.url).isReady();
    const layerByName = endpoint.getLayerByName(layer.name);
    const advertisedLegendUrl = findStyleLegendUrl(
      layerByName?.styles,
      layer.style,
      false,
    );

    if (advertisedLegendUrl) {
      return advertisedLegendUrl;
    }
  } catch {
    // Capabilities unavailable; fall back to a GetLegendGraphic request.
  }

  return buildWmsGetLegendGraphicUrl(layer, options).toString();
}

/**
 * Build a WMS `GetLegendGraphic` request URL from a layer's base URL.
 *
 * @param layer - The MapContextLayer to create a legend URL for
 * @param options - Optional configuration for legend generation
 * @returns A URL for the WMS legend graphic
 */
function buildWmsGetLegendGraphicUrl(
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
 * Create a legend URL for a WMTS layer
 *
 * @param layer - The MapContextLayer to create a legend URL for
 * @returns A URL for the WMTS legend graphic or null if not available
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

  return findStyleLegendUrl(layerByName.styles, layer.style);
}

/**
 * Creates a legend from a layer.
 *
 * @param {MapContextLayer} layer - The layer to create the legend from.
 * @param {LegendOptions} [options] - The options to create the legend.
 * @returns {Promise<HTMLElement | null>} A promise that resolves to the legend element or `null` if the legend could not be created.
 */
export async function createLegendFromLayer(
  layer: MapContextLayer,
  options: LegendOptions = {},
): Promise<HTMLElement | null> {
  if (!hasLegendSupport(layer) || !layer.url || !layer.name) {
    console.error("Invalid layer for legend creation");
    return null;
  }

  // Create a container for the legend
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

  // Error handling for failed image loading
  img.onerror = (e) => {
    console.warn(`Failed to load legend for layer: ${layer.name}`, e);
    const errorMessage = document.createElement("span");
    errorMessage.textContent = `Legend not available for ${layer.name}`;
    layerDiv.replaceChild(errorMessage, img);
  };

  try {
    let legendUrl: string | null = null;

    // Determine legend URL based on layer type
    if (layer.type === "wms") {
      legendUrl = await createWmsLegendUrl(layer, options);
    } else if (layer.type === "wmts") {
      legendUrl = await createWmtsLegendUrl(layer);
    }

    // If legend URL is available, set the image source
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
