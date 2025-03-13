import { ImageTile, Tile } from "ol";
import TileState from "ol/TileState.js";
import { SourceLoadErrorEvent } from "@geospatial-sdk/core";
import { handleTileError, tileLoadErrorCatchFunction } from "./handle-errors";
import { Map } from "ol";
import { describe } from "node:test";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { XYZ } from "ol/source";
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
      () => tileLoadErrorCatchFunction
    );
  });

  describe("handleEndpointError", () => {
    it("should dispatch SourceLoadErrorEvent", () => {
      const endpointErrorMock: EndpointError = {
        name: "Error",
        message: "FORBIDDEN",
        httpStatus: 403,
      };
      const layer = new VectorLayer({
        source: new VectorSource(),
      });
      const source = layer.getSource();
      const dispatchEventSpy = vi.spyOn(source, "dispatchEvent");
      if (source) {
        handleTileError(endpointErrorMock, tile, source);
      }
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        new SourceLoadErrorEvent(endpointErrorMock)
      );
    });
  });

  describe("handleTileError", () => {
    it("should set tile state to ERROR and dispatch SourceLoadErrorEvent", () => {
      const response = new Response("Forbidden", { status: 403 });
      const layer = new TileLayer({
        source: new XYZ(),
      });
      const source = layer.getSource();
      const dispatchEventSpy = vi.spyOn(source, "dispatchEvent");
      const setStateEventSpy = vi.spyOn(tile, "setState");
      handleTileError(response, tile, source);
      expect(setStateEventSpy).toHaveBeenCalledWith(TileState.ERROR);
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        new SourceLoadErrorEvent(response)
      );
    });
  });

  //TODO: Find a way to test tileLoadErrorCatchFunction
  describe("tileLoadErrorCatchFunction", () => {
    it("should call handleTileError on error", async () => {
      const handleErrorSpy = vi.spyOn({ handleTileError }, "handleTileError");
      // try {
      const layer = new TileLayer({
        source: new XYZ(),
      });
      const source = layer.getSource();
      if (source) {
        await tileLoadErrorCatchFunction(
          source,
          tile,
          "http://example.com/tile/error"
        );
        //Why does spy not wait for await?
        console.log("handleErrorSpy", handleErrorSpy);
        expect(handleErrorSpy).toHaveBeenCalled();
      }
      // } catch (e) {
      // console.log("ERROR", e);

      // }
    });

    it("should set tile image source on success", async () => {
      // const createObjectURLSpy = vi
      //   .spyOn(URL, "createObjectURL")
      //   .mockReturnValue("blob:http://example.com/blob");

      const mockBlob = new Blob();
      const RESPONSE_OK = {
        status: 200,
        blob: vi.fn().mockResolvedValue(mockBlob),
      };
      global.fetch = vi.fn(() => Promise.resolve(RESPONSE_OK as Response));

      await tileLoadErrorCatchFunction(tile, "http://example.com/tile", map);

      // expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      const imageElement = (tile as ImageTile).getImage() as HTMLImageElement;
      expect(imageElement.src).toBe(URL.createObjectURL(mockBlob));
    });
  });
});
