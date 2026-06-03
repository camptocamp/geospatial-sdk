import { ImageTile, Tile } from "ol";
import { Layer } from "ol/layer.js";
import TileState from "ol/TileState.js";
import { emitLayerLoadingError } from "./register-events.js";

export function tileLoadErrorCatchFunction(
  layer: Layer,
  tile: Tile,
  src: string,
) {
  const referrerPolicy =
    "getReferrerPolicy" in tile
      ? (tile as ImageTile).getReferrerPolicy()
      : undefined;
  fetch(src, { ...(referrerPolicy && { referrerPolicy }) })
    .then((response) => {
      if (response.ok) {
        response
          .blob()
          .then((blob) => {
            const image = (tile as ImageTile).getImage();
            (image as HTMLImageElement).src = URL.createObjectURL(blob);
          })
          .catch((error) => {
            tile.setState(TileState.ERROR);
            emitLayerLoadingError(layer, error);
          });
      } else {
        tile.setState(TileState.ERROR);
        response.text().then((text) => {
          emitLayerLoadingError(layer, new Error(text), response.status);
        });
      }
    })
    .catch((error) => {
      tile.setState(TileState.ERROR);
      emitLayerLoadingError(layer, error);
    });
}
