import { ImageTile, Tile } from "ol";
import TileState from "ol/TileState.js";
import { SourceLoadErrorEvent } from "@geospatial-sdk/core";
import {
  handleTileError,
  imageTileLoadErrorCatchFunction,
} from "./handle-errors";
import { Map } from "ol";
import { describe } from "node:test";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { EndpointError } from "@camptocamp/ogc-client";

global.URL.createObjectURL = vi.fn(() => "blob:http://example.com/blob");

const mockBlob = new Blob();
const RESPONSE_OK = {
  status: 200,
  blob: vi.fn().mockResolvedValue(mockBlob),
};
const RESPONSE_ERROR = {
  status: 404,
};
global.fetch = vi.fn().mockImplementation((url: string) => {
  return url.includes("error")
    ? Promise.reject(RESPONSE_ERROR as Response)
    : Promise.resolve(RESPONSE_OK as Response);
});

describe("handle-errors", () => {
  let map: Map;
  let tile: Tile;

  beforeEach(() => {
    map = new Map();
    tile = new ImageTile(
      [0, 0, 0],
      TileState.IDLE,
      "",
      null,
      () => imageTileLoadErrorCatchFunction,
    );
  });

  describe("handleEndpointError", () => {
    it("should dispatch SourceLoadErrorEvent", () => {
      const endpointErrorMock: EndpointError = {
        name: "Error",
        message: "FORBIDDEN",
        httpStatus: 403,
      };
      const layer = new VectorLayer({});
      const dispatchEventSpy = vi.spyOn(layer, "dispatchEvent");
      handleTileError(endpointErrorMock, tile, layer);
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        new SourceLoadErrorEvent(endpointErrorMock),
      );
    });
  });

  describe("handleTileError", () => {
    it("should set tile state to ERROR and dispatch SourceLoadErrorEvent", () => {
      const response = new Response("Forbidden", { status: 403 });
      const layer = new TileLayer({});
      const dispatchEventSpy = vi.spyOn(layer, "dispatchEvent");
      const setStateEventSpy = vi.spyOn(tile, "setState");
      handleTileError(response, tile, layer);
      expect(setStateEventSpy).toHaveBeenCalledWith(TileState.ERROR);
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        new SourceLoadErrorEvent(response),
      );
    });
  });
});
