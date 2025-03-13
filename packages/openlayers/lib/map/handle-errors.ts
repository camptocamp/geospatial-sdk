import { EndpointError } from "@camptocamp/ogc-client";
import { SourceLoadErrorEvent } from "@geospatial-sdk/core";
import { ImageTile, Tile } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { Source } from "ol/source";
import TileSource from "ol/source/Tile";
import VectorSource from "ol/source/Vector";
import TileState from "ol/TileState.js";

export function handleEndpointError(
  layer: TileLayer<TileSource> | VectorLayer<VectorSource>,
  error: EndpointError
) {
  console.error("Error loading Endpoint", error);
  const source = layer.getSource();
  if (source) {
    source.dispatchEvent(new SourceLoadErrorEvent(error));
  }
}

export function handleTileError(
  response: Response | Error,
  tile: Tile,
  source: Source
) {
  console.error("Error loading tile", response);
  tile.setState(TileState.ERROR);
  source.dispatchEvent(new SourceLoadErrorEvent(response));
}

export function tileLoadErrorCatchFunction(
  source: Source,
  tile: Tile,
  src: string
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
            handleTileError(response, tile, source);
          });
      } else {
        handleTileError(response, tile, source);
      }
    })
    .catch((error) => {
      handleTileError(error, tile, source);
    });
}
