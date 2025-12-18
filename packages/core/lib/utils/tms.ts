import { MapContextLayerXyz } from "../model";
import { TmsEndpoint } from "@camptocamp/ogc-client";

/**
 * Creates a MapContextLayerXyz from a TMS endpoint URL and tile map name
 * @param tmsUrl - The URL of the TMS endpoint
 * @param tileMapName - The title of the TileMap to use
 * @param srs - SRS code (e.g., "EPSG:4326")
 * @returns A MapContextLayerXyz object with the correct tile URL pattern
 */
export async function createXyzFromTms(
  tmsUrl: string,
  tileMapName: string,
  srs: string,
): Promise<MapContextLayerXyz> {
  const endpoint = await new TmsEndpoint(tmsUrl);
  const tileMaps = await endpoint.allTileMaps;
  const tileMap = tileMaps.find(
    (tm) => tm.title === tileMapName && tm.srs === srs,
  );

  if (!tileMap) {
    throw new Error(
      `TileMap with title "${tileMapName}" not found in TMS endpoint. Available maps: ${tileMaps.map((tm) => tm.title).join(", ")}`,
    );
  }

  const tileMapInfo = await endpoint.getTileMapInfo(tileMap.href);
  const extension = tileMapInfo.tileFormat?.extension;
  const tileSetHref = tileMapInfo.tileSets?.[0]?.href;

  if (!tileSetHref) {
    throw new Error(
      `No TileSets found for TileMap "${tileMapName}" in TMS endpoint`,
    );
  }

  // Extract the base URL by removing the last path segment (the zoom level)
  // Example: https://example.com/tms/1.0.0/layer@EPSG:4326@png/0
  // becomes: https://example.com/tms/1.0.0/layer@EPSG:4326@png/{z}/{x}/{y}.png
  const baseUrl = tileSetHref.substring(0, tileSetHref.lastIndexOf("/"));
  const urlPattern = `${baseUrl}/{z}/{x}/{y}.${extension}`;

  const layer: MapContextLayerXyz = {
    type: "xyz",
    url: urlPattern,
  };

  return layer;
}
