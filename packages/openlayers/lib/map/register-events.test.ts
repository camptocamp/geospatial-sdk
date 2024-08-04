import Map, { FrameState } from "ol/Map";
import { Mock } from "vitest";
import { listen } from "./register-events";
import { MapBrowserEvent, MapEvent } from "ol";
import View from "ol/View";
import { toLonLat } from "ol/proj";

function createMap(): Map {
  const target = document.createElement("div");
  const map = new Map({
    target,
    view: new View({
      projection: "EPSG:3857",
    }),
    layers: [],
  });
  Object.defineProperty(map.getViewport(), "getBoundingClientRect", {
    value: () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
    }),
  });
  map.setSize([100, 100]);
  return map;
}

describe("event registration", () => {
  let map: Map;
  beforeEach(() => {
    map = createMap();
  });
  describe("features hover event", () => {
    let callback: Mock;
    beforeEach(() => {
      callback = vi.fn();
      listen(map, "features-hover", callback);
    });
    it("registers the event on the map", () => {
      map.dispatchEvent(new MapEvent("pointermove", map));
      expect(callback).toHaveBeenCalledWith({
        type: "features-hover",
        features: [],
        target: map,
      });
    });
  });
  describe("features click event", () => {
    let callback: Mock;
    beforeEach(() => {
      callback = vi.fn();
      listen(map, "features-click", callback);
    });
    it("registers the event on the map", () => {
      map.dispatchEvent(new MapEvent("click", map));
      expect(callback).toHaveBeenCalledWith({
        type: "features-click",
        features: [],
        target: map,
      });
    });
  });
  describe("map click event", () => {
    let callback: Mock;
    beforeEach(() => {
      callback = vi.fn();
      listen(map, "map-click", callback);
    });
    it("registers the event on the map", () => {
      map.dispatchEvent(
        new MapBrowserEvent(
          "click",
          map,
          new MouseEvent("click", {
            clientX: 10,
            clientY: 10,
          }),
          false,
          {
            coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
            pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
          } as FrameState,
        ),
      );
      expect(callback).toHaveBeenCalledWith({ coordinate: toLonLat([10, 10]) });
    });
  });
});
