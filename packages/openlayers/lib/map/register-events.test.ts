import Map from "ol/Map";
import { Mock } from "vitest";
import {
  getFeaturesFromVectorSources,
  getFeaturesFromWmsSources,
  getGFIUrl,
  listen,
} from "./register-events";
import { Collection, MapBrowserEvent, Object as BaseObject } from "ol";
import View from "ol/View";
import { toLonLat } from "ol/proj";
import TileWMS from "ol/source/TileWMS";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import OlFeature from "ol/Feature";

const EXPECTED_MAP_EXTENT_EPSG4326 = [
  -0.0035932611364780857, -0.0026949458513598756, 0.0035932611364780857,
  0.0026949458513740865,
];

const gfiResult = {
  type: "Feature",
  properties: {
    density: 123,
  },
  geometry: null,
};
function createWmsSource() {
  return new TileWMS({
    url: "http://my.service.org/wms?SERVICE=WMS",
    params: {
      LAYERS: "layerName",
      FORMAT: "image/png",
      TRANSPARENT: true,
    },
  });
}
function createMap(): Map {
  const wmsLayer = new TileLayer({
    source: createWmsSource(),
  });
  const feature = new OlFeature({
    geometry: new Point([100, 200]),
  });
  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: [feature],
    }),
  });
  const view = new View({
    projection: "EPSG:3857",
    resolution: 1,
    center: [0, 0],
  });
  const map = new BaseObject() as Map;
  Object.defineProperties(map, {
    getView: { value: vi.fn(() => view) },
    getLayers: { value: vi.fn(() => new Collection([wmsLayer, vectorLayer])) },
    getEventPixel: { value: vi.fn(() => [10, 10]) },
    getCoordinateFromPixel: { value: vi.fn(() => [123, 123]) },
    getFeaturesAtPixel: { value: vi.fn(() => [feature]) },
    getSize: { value: vi.fn(() => [800, 600]) },
  });
  return map;
}
function createMapEvent(map: Map, type: string) {
  return new MapBrowserEvent(
    type,
    map,
    new MouseEvent(type, {
      clientX: 10,
      clientY: 10,
    }),
    false,
  );
}

describe("event registration", () => {
  let map: Map;
  beforeEach(() => {
    map = createMap();
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ features: [gfiResult] }),
      } as Response),
    );
    vi.useFakeTimers();
  });
  describe("getFeaturesFromVectorSources", () => {
    it("returns an array of features", () => {
      const features = getFeaturesFromVectorSources(map, [0, 0]);
      expect(features).toEqual([
        {
          geometry: {
            coordinates: [100, 200],
            type: "Point",
          },
          properties: null,
          type: "Feature",
        },
      ]);
    });
  });
  describe("getGFIUrl", () => {
    let url: string;
    const coordinate = [-182932.49329334166, 6125319.813853541];
    beforeEach(() => {
      const wmsSource = createWmsSource();
      url = getGFIUrl(wmsSource, map, coordinate) as string;
    });
    it("returns true", () => {
      expect(url).toEqual(
        "http://my.service.org/wms?SERVICE=WMS&REQUEST=GetFeatureInfo&QUERY_LAYERS=layerName&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=layerName&INFO_FORMAT=application%2Fjson&I=176&J=31&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX=-183143.11977128312%2C6125051.950547744%2C-182837.37165814242%2C6125357.698660884",
      );
    });
  });
  describe("getFeaturesFromWmsSources", () => {
    it("queries the WMS sources", async () => {
      const features = await getFeaturesFromWmsSources(map, [0, 0]);
      expect(features).toEqual([gfiResult]);
    });
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
        features: [
          {
            geometry: {
              coordinates: [100, 200],
              type: "Point",
            },
            properties: null,
            type: "Feature",
          },
          {
            geometry: null,
            properties: {
              density: 123,
            },
            type: "Feature",
          },
        ],
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
        features: [
          {
            geometry: {
              coordinates: [100, 200],
              type: "Point",
            },
            properties: null,
            type: "Feature",
          },
          {
            geometry: null,
            properties: {
              density: 123,
            },
            type: "Feature",
          },
        ],
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
