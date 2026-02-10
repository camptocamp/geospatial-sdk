import { ImageTile, Tile } from "ol";
import { Layer } from "ol/layer.js";
import TileState from "ol/TileState.js";
import { emitLayerLoadingError } from "./register-events.js";

export function tileLoadErrorCatchFunction(
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
          .catch((error) => {
            tile.setState(TileState.ERROR);
            emitLayerLoadingError(layer, error);
          });
      } else {
        response.text().then((text) => {
          emitLayerLoadingError(layer, new Error(text), response.status);
        });
      }
    })
    .catch((error) => {
      emitLayerLoadingError(layer, error);
    });
}
