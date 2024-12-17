import {
  MapContextLayer,
  MapContextLayerWms,
  MapContextLayerWmts,
  removeSearchParams,
} from "@geospatial-sdk/core";
import { WmtsEndpoint } from "@camptocamp/ogc-client";

/**
 * Configuration options for legend generation
 */
interface LegendOptions {
  format?: string;
  widthPxHint?: number;
  heightPxHint?: number;
}

/**
 * Create a legend URL for a WMS layer
 *
 * @param layer - The MapContextLayer to create a legend URL for
 * @param options - Optional configuration for legend generation
 * @returns A URL for the WMS legend graphic
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
      "WIDTH",
      "HEIGHT",
    ]),
  );
  legendUrl.searchParams.set("SERVICE", "WMS");
  legendUrl.searchParams.set("REQUEST", "GetLegendGraphic");
  legendUrl.searchParams.set("FORMAT", format);
  legendUrl.searchParams.set("LAYER", layer.name);
  legendUrl.searchParams.set("LAYERTITLE", false.toString()); // Disable layer title for QGIS Server

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
  console.log("layerByName");
  console.log(layerByName);

  if (
    layerByName.styles &&
    layerByName.styles.length > 0 &&
    layerByName.styles[0].legendUrl
  ) {
    return layerByName.styles[0].legendUrl;
  }

  return null;
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
  if (
    (layer.type !== "wms" && layer.type !== "wmts") ||
    !layer.url ||
    !layer.name
  ) {
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
      legendUrl = createWmsLegendUrl(layer, options).toString();
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
