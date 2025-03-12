import { ImageTile, Tile } from "ol";
import TileState from "ol/TileState.js";
import { SourceLoadErrorEvent } from "@geospatial-sdk/core";
import {
  handleError,
  tileLoadErrorCatchFunction,
  getEndpoint,
} from "./handle-errors";
import { Map } from "ol";

vi.mock("@camptocamp/ogc-client", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    WmtsEndpoint: vi.fn().mockImplementation((url) => {
      const instance = new actual.WmtsEndpoint();
      instance.isReady = vi.fn().mockImplementation(() =>
        url.includes("error")
          ? Promise.reject(
              Object.assign(new Error("MOCKED ERROR"), {
                httpStatus: 404,
                isCrossOriginRelated: false,
              })
            )
          : Promise.resolve(instance)
      );
      return instance;
    }),
    WfsEndpoint: vi.fn().mockImplementation(() => {
      const instance = new actual.WmtsEndpoint("");
      instance.isReady = vi
        .fn()
        .mockImplementation(() => Promise.resolve(instance));
      return instance;
    }),
  };
});

global.URL.createObjectURL = vi.fn(() => "blob:http://example.com/blob");

// const mockBlob = new Blob();
// const RESPONSE_OK = {
//   status: 200,
//   blob: vi.fn().mockResolvedValue(mockBlob),
// };
// const RESPONSE_ERROR = {
//   status: 404,
// };
// global.fetch = vi.fn((url: string) => {
//   return url.includes("error")
//     ? Promise.resolve(RESPONSE_ERROR as Response)
//     : Promise.resolve(RESPONSE_OK as Response);
// });

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

  describe("handleError", () => {
    it("should set tile state to ERROR and dispatch SourceLoadErrorEvent", () => {
      const dispatchEventSpy = vi.spyOn(map, "dispatchEvent");
      const setStateEventSpy = vi.spyOn(tile, "setState");
      handleError(404, tile, map);
      expect(setStateEventSpy).toHaveBeenCalledWith(TileState.ERROR);
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        new SourceLoadErrorEvent(404)
      );
    });
  });

  // //TODO: Find a way to test tileLoadErrorCatchFunction
  // describe("tileLoadErrorCatchFunction", () => {
  //   // it("should set tile state to ERROR and dispatch SourceLoadErrorEvent on error", async () => {
  //   //   const RESPONSE = {
  //   //     status: 404,
  //   //     blob: vi.fn().mockRejectedValue(new Error("Not Found")),
  //   //   };
  //   //   global.fetch = vi.fn(() => Promise.resolve(RESPONSE as Response));

  //   //   const dispatchEventSpy = vi.spyOn(map, "dispatchEvent");
  //   //   const setStateEventSpy = vi.spyOn(tile, "setState");

  //   //   await tileLoadErrorCatchFunction(tile, "http://example.com/tile", map);
  //   //   console.log("tile", tile.getState());
  //   //   // expect(tile.getState()).toBe(TileState.ERROR);
  //   //   expect(setStateEventSpy).toHaveBeenCalledWith(TileState.ERROR);

  //   //   expect(dispatchEventSpy).toHaveBeenCalledWith(
  //   //     new SourceLoadErrorEvent(404)
  //   //   );
  //   // });
  //   it("should call handleError on error", async () => {
  //     const handleErrorSpy = vi.spyOn({ handleError }, "handleError");
  //     // try {
  //     await tileLoadErrorCatchFunction(
  //       tile,
  //       "http://example.com/tile/error",
  //       map
  //     );
  //     // } catch (e) {
  //     // console.log("ERROR", e);
  //     expect(handleErrorSpy).toHaveBeenCalled();
  //     // }
  //   });

  //   it("should set tile image source on success", async () => {
  //     // const createObjectURLSpy = vi
  //     //   .spyOn(URL, "createObjectURL")
  //     //   .mockReturnValue("blob:http://example.com/blob");

  //     const mockBlob = new Blob();
  //     const RESPONSE_OK = {
  //       status: 200,
  //       blob: vi.fn().mockResolvedValue(mockBlob),
  //     };
  //     global.fetch = vi.fn(() => Promise.resolve(RESPONSE_OK as Response));

  //     await tileLoadErrorCatchFunction(tile, "http://example.com/tile", map);

  //     // expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
  //     const imageElement = (tile as ImageTile).getImage() as HTMLImageElement;
  //     expect(imageElement.src).toBe(URL.createObjectURL(mockBlob));
  //   });
  // });

  describe("getEndpoint", () => {
    it("should call WmtsEndpoint.isReady() on success", async () => {
      const endpoint = await getEndpoint(
        "http://example.com/wmts",
        "wmts",
        map
      );
      expect(endpoint.isReady).toHaveBeenCalled();
    });
    it("should call WfsEndpoint.isReady() on success", async () => {
      const endpoint = await getEndpoint("http://example.com/wfs", "wfs", map);
      expect(endpoint.isReady).toHaveBeenCalled();
    });

    it("should dispatch SourceLoadErrorEvent on error", async () => {
      const dispatchEventSpy = vi.spyOn(map, "dispatchEvent");
      try {
        await getEndpoint("http://example.com/wmts/error", "wmts", map);
      } catch (e) {
        console.log("ERROR", e);
      }

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        new SourceLoadErrorEvent(404)
      );
    });
  });
});
