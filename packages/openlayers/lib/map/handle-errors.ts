import {
  EndpointError,
  WfsEndpoint,
  WmtsEndpoint,
} from "@camptocamp/ogc-client";
import { SourceLoadErrorEvent } from "@geospatial-sdk/core";
import { ImageTile, Map, Tile } from "ol";
import TileState from "ol/TileState.js";

function handleError(statusCode: number, tile: Tile, map: Map) {
  tile.setState(TileState.ERROR);
  map.dispatchEvent(new SourceLoadErrorEvent(statusCode));
}

export function tileLoadErrorCatchFunction(tile: Tile, src: string, map: Map) {
  fetch(src).then((response) => {
    if (response.status === 200) {
      response
        .blob()
        .then((blob) => {
          ((tile as ImageTile).getImage() as HTMLImageElement).src =
            URL.createObjectURL(blob);
        })
        .catch((error) => {
          console.error("Error loading tile", error);
          handleError(response.status, tile, map);
        });
    } else {
      handleError(response.status, tile, map);
    }
  });
}

export async function getEndpoint(
  url: string,
  type: "wmts" | "wfs",
  map: Map,
): Promise<WmtsEndpoint | WfsEndpoint> {
  try {
    if (type === "wfs") {
      return await new WfsEndpoint(url).isReady();
    } else {
      return await new WmtsEndpoint(url).isReady();
    }
  } catch (e: any) {
    if (
      e instanceof Error &&
      "isCrossOriginRelated" in e &&
      "httpStatus" in e
    ) {
      const error = e as EndpointError;
      if (error.httpStatus && error.httpStatus >= 400) {
        map.dispatchEvent(new SourceLoadErrorEvent(error.httpStatus));
        return Promise.reject(e);
      }
    }
    map.dispatchEvent(new SourceLoadErrorEvent(-1));
    return Promise.reject(e);
  }
}
