import { EndpointError } from "@camptocamp/ogc-client";
import { SourceLoadErrorEvent } from "@geospatial-sdk/core";
import { ImageTile, Tile, VectorTile } from "ol";
import { Layer } from "ol/layer";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import TileSource from "ol/source/Tile";
import VectorSource from "ol/source/Vector";
import { defaultLoadFunction } from "ol/source/VectorTile";
import TileState from "ol/TileState.js";

export function handleEndpointError(
  layer: TileLayer<TileSource> | VectorLayer<VectorSource>,
  error: EndpointError,
) {
  console.error("Error loading Endpoint", error);
  layer.dispatchEvent(new SourceLoadErrorEvent(error));
}

export function handleTileError(
  response: Response | Error,
  tile: Tile,
  layer: Layer,
) {
  console.error("Error loading tile", response);
  tile.setState(TileState.ERROR);
  layer.dispatchEvent(new SourceLoadErrorEvent(response));
}

export function vectorTileLoadErrorCatchFunction(
  layer: Layer,
  tile: Tile,
  url: string,
) {
  try {
    // TODO: WIP override?
    defaultLoadFunction(<VectorTile>tile, url);
  } catch (e) {
    handleTileError(<Error>e, tile, layer);
  }
}

export function imageTileLoadErrorCatchFunction(
  layer: Layer,
  tile: Tile,
  src: string,
) {
  fetch(src)
    .then((response) => {
      if (response.ok) {
        response
          .blob()
          .then((blob) => {
            const image = (tile as ImageTile).getImage();
            (image as HTMLImageElement).src = URL.createObjectURL(blob);
          })
          .catch(() => {
            handleTileError(response, tile, layer);
          });
      } else {
        handleTileError(response, tile, layer);
      }
    })
    .catch((error) => {
      handleTileError(error, tile, layer);
    });
}
