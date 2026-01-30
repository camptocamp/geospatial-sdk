import OlMap from "ol/Map.js";
import { Mock } from "vitest";
import { listen } from "./register-events.js";
import { MapBrowserEvent, Object as BaseObject } from "ol";
import View from "ol/View.js";
import { toLonLat } from "ol/proj.js";
import { FeaturesHoverEventType } from "@geospatial-sdk/core";
import BaseEvent from "ol/events/Event.js";

vi.mock("./get-features.js", () => ({
  readFeaturesAtPixel() {
    return Promise.resolve(
      new Map([
        [
          0,
          [
            {
              geometry: {
                coordinates: [100, 200],
                type: "Point",
              },
              properties: null,
              type: "Feature",
            },
          ],
        ],
        [
          1,
          [
            {
              geometry: null,
              properties: {
                density: 123,
              },
              type: "Feature",
            },
          ],
        ],
      ]),
    );
  },
}));

const featureA = {
  geometry: {
    coordinates: [100, 200],
    type: "Point",
  },
  properties: null,
  type: "Feature",
};
const featureB = {
  geometry: null,
  properties: {
    density: 123,
  },
  type: "Feature",
};

const EXPECTED_MAP_EXTENT_EPSG4326 = [
  -0.0035932611364780857, -0.0026949458513598756, 0.0035932611364780857,
  0.0026949458513740865,
];

function createMap(): OlMap {
  const view = new View({
    projection: "EPSG:3857",
    resolution: 1,
    center: [0, 0],
  });
  const map = new BaseObject() as OlMap;
  Object.defineProperties(map, {
    getView: { value: vi.fn(() => view) },
    getEventPixel: { value: vi.fn(() => [10, 10]) },
    getCoordinateFromPixel: { value: vi.fn(() => [123, 123]) },
    getSize: { value: vi.fn(() => [800, 600]) },
  });
  // simulate hover feature initialization
  map.on("pointermove", () => {
    map.dispatchEvent({
      type: FeaturesHoverEventType,
      features: [featureB],
      featuresByLayer: new Map([[0, [featureB]]]),
    } as unknown as BaseEvent);
  });
  return map;
}
function createMapEvent(map: OlMap, type: string) {
  return new MapBrowserEvent(
    type,
    map,
    new MouseEvent(type, {
      clientX: 10,
      clientY: 10,
    }) as PointerEvent,
    false,
  );
}

describe("event registration", () => {
  let map: OlMap;
  beforeEach(() => {
    map = createMap();
    vi.useFakeTimers();
  });
  describe("features hover event", () => {
    let callback: Mock;
    beforeEach(async () => {
      callback = vi.fn();
      listen(map, "features-hover", callback);
      map.dispatchEvent(createMapEvent(map, "pointermove"));
      await vi.runAllTimersAsync();
    });
    it("registers the event on the map", () => {
      expect(callback).toHaveBeenCalledWith({
        type: "features-hover",
        features: [featureB],
        featuresByLayer: new Map([[0, [featureB]]]),
        target: expect.anything(),
      });
    });
  });
  describe("features click event", () => {
    let callback: Mock;
    beforeEach(async () => {
      callback = vi.fn();
      listen(map, "features-click", callback);
      map.dispatchEvent(createMapEvent(map, "click"));
      await vi.runAllTimersAsync();
    });
    it("registers the event on the map", () => {
      expect(callback).toHaveBeenCalledWith({
        type: "features-click",
        features: [featureA, featureB],
        featuresByLayer: new Map([
          [0, [featureA]],
          [1, [featureB]],
        ]),
        target: expect.anything(),
      });
    });
  });
  describe("map click event", () => {
    let callback: Mock;
    beforeEach(() => {
      callback = vi.fn();
      listen(map, "map-click", callback);
      map.dispatchEvent(createMapEvent(map, "click"));
    });
    it("registers the event on the map", () => {
      expect(callback).toHaveBeenCalledWith({
        coordinate: toLonLat([123, 123]),
        type: "map-click",
      });
    });
  });
  describe("map extent change event", () => {
    let callback: Mock;

    beforeEach(() => {
      callback = vi.fn();
      listen(map, "map-extent-change", callback);
    });

    it("should registers the event on the map when center changed", () => {
      map.getView().dispatchEvent(createMapEvent(map, "change:center"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
        target: expect.anything(),
      });
    });

    it("should registers the event on the map when resolution changed", () => {
      map.getView().dispatchEvent(createMapEvent(map, "change:resolution"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
        target: expect.anything(),
      });
    });

    it("should registers the event on the map when rotation changed", () => {
      map.getView().dispatchEvent(createMapEvent(map, "change:rotation"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
        target: expect.anything(),
      });
    });

    it("should registers the event on the map when size changed", () => {
      map.dispatchEvent(createMapEvent(map, "change:size"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
        target: expect.anything(),
      });
    });

    it("should send map-extent-change only once when multiple events occur with same extent", () => {
      map.getView().dispatchEvent(createMapEvent(map, "change:center"));
      map.getView().dispatchEvent(createMapEvent(map, "change:resolution"));
      map.getView().dispatchEvent(createMapEvent(map, "change:rotation"));
      map.dispatchEvent(createMapEvent(map, "change:size"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
        target: expect.anything(),
      });
    });

    it("should send map-extent-change twice when view properties actually change", () => {
      map.getView().setCenter([1000, 1000]);
      map.getView().dispatchEvent(createMapEvent(map, "change:center"));

      map.getView().setResolution(2);
      map.getView().dispatchEvent(createMapEvent(map, "change:resolution"));

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "map-extent-change",
          extent: expect.any(Array),
        }),
      );

      const firstCall = callback.mock.calls[0][0];
      const lastCall = callback.mock.calls[1][0];
      expect(firstCall.extent).not.toEqual(lastCall.extent);
    });

    it("should send map-extent-change only once when same view property is set multiple times to same value", () => {
      map.getView().setCenter([1000, 1000]);
      map.getView().dispatchEvent(createMapEvent(map, "change:center"));

      map.getView().setCenter([1000, 1000]);
      map.getView().dispatchEvent(createMapEvent(map, "change:center"));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "map-extent-change",
          extent: expect.any(Array),
        }),
      );
    });
  });
});
