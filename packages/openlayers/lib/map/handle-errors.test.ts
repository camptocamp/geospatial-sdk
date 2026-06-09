import ImageTile from "ol/ImageTile.js";
import TileLayer from "ol/layer/Tile.js";
import TileState from "ol/TileState.js";
import VectorLayer from "ol/layer/Vector.js";
import { emitLayerLoadingError } from "./register-events.js";
import { tileLoadErrorCatchFunction } from "./handle-errors.js";

globalThis.URL.createObjectURL = vi.fn(() => "blob:http://example.com/blob");

const mockBlob = new Blob();
const RESPONSE_OK = {
  ok: true,
  status: 200,
  blob: vi.fn().mockResolvedValue(mockBlob),
};
const RESPONSE_ERROR = {
  status: 404,
};
globalThis.fetch = vi.fn().mockImplementation((url: string) => {
  return url.includes("error")
    ? Promise.reject(RESPONSE_ERROR)
    : Promise.resolve(RESPONSE_OK);
});

describe("handle-errors", () => {
  describe("tileLoadErrorCatchFunction", () => {
    let layer: TileLayer<never>;

    beforeEach(() => {
      vi.clearAllMocks();
      layer = new TileLayer({});
    });

    it("should call fetch with referrerPolicy from the tile when set", () => {
      const tile = new ImageTile(
        [0, 0, 0],
        TileState.IDLE,
        "http://example.com/tile",
        { referrerPolicy: "strict-origin-when-cross-origin" },
        () => {},
      );
      tileLoadErrorCatchFunction(layer, tile, "http://example.com/tile");
      expect(fetch).toHaveBeenCalledWith("http://example.com/tile", {
        referrerPolicy: "strict-origin-when-cross-origin",
      });
    });

    it("should call fetch without referrerPolicy when tile has none", () => {
      const tile = new ImageTile(
        [0, 0, 0],
        TileState.IDLE,
        "http://example.com/tile",
        null,
        () => {},
      );
      tileLoadErrorCatchFunction(layer, tile, "http://example.com/tile");
      expect(fetch).toHaveBeenCalledWith("http://example.com/tile", {});
    });

    it("should set tile state to ERROR on fetch rejection", async () => {
      const tile = new ImageTile(
        [0, 0, 0],
        TileState.IDLE,
        "http://example.com/error",
        null,
        () => {},
      );
      const setStateSpy = vi.spyOn(tile, "setState");
      tileLoadErrorCatchFunction(layer, tile, "http://example.com/error");
      await Promise.resolve();
      await Promise.resolve();
      expect(setStateSpy).toHaveBeenCalledWith(TileState.ERROR);
    });
  });
  describe("handleEndpointError", () => {
    it("should dispatch SourceLoadErrorEvent", () => {
      const layer = new VectorLayer({});
      const dispatchEventSpy = vi.spyOn(layer, "dispatchEvent");
      emitLayerLoadingError(layer, new Error("FORBIDDEN"), 403);
      expect(dispatchEventSpy).toHaveBeenCalledWith({
        type: "--geospatial-sdk-layer-loading-error",
        error: new Error("FORBIDDEN"),
        httpStatus: 403,
      });
    });
  });

  describe("handleTileError", () => {
    it("should set tile state to ERROR and dispatch SourceLoadErrorEvent", () => {
      const layer = new TileLayer({});
      const dispatchEventSpy = vi.spyOn(layer, "dispatchEvent");
      emitLayerLoadingError(layer, new Error("Forbidden"), 403);
      expect(dispatchEventSpy).toHaveBeenCalledWith({
        type: "--geospatial-sdk-layer-loading-error",
        error: new Error("Forbidden"),
        httpStatus: 403,
      });
    });
  });
});
