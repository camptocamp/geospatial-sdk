import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import { emitLayerLoadingError } from "./register-events.js";

globalThis.URL.createObjectURL = vi.fn(() => "blob:http://example.com/blob");

const mockBlob = new Blob();
const RESPONSE_OK = {
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
