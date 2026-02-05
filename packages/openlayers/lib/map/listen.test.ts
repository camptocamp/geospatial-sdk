import OlMap from "ol/Map.js";
import { Mock } from "vitest";
import { listen } from "./listen.js";
import { MapBrowserEvent, Object as BaseObject } from "ol";
import View from "ol/View.js";
import { toLonLat } from "ol/proj.js";
import { FeaturesHoverEventType } from "@geospatial-sdk/core";
import BaseEvent from "ol/events/Event.js";
import { GEOSPATIAL_SDK_PREFIX } from "./constants.js";
import { createLayer, resetMapFromContext } from "./create-map.js";
import {
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_WFS_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
  MAP_CTX_LAYER_WMTS_FIXTURE,
  MAP_CTX_LAYER_XYZ_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import { applyContextDiffToMap } from "./apply-context-diff.js";

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

async function createMap() {
  const view = new View({
    projection: "EPSG:3857",
    resolution: 1,
    center: [0, 0],
  });
  const layer1 = await createLayer(MAP_CTX_LAYER_WMS_FIXTURE);
  const layer2 = await createLayer(MAP_CTX_LAYER_WMS_FIXTURE);
  const layer3 = await createLayer(MAP_CTX_LAYER_GEOJSON_FIXTURE);
  const map = new BaseObject() as OlMap;
  const layers = [layer1, layer2, layer3];
  Object.defineProperties(map, {
    getView: { value: vi.fn(() => view) },
    setView: { value: vi.fn() },
    getEventPixel: { value: vi.fn(() => [10, 10]) },
    getCoordinateFromPixel: { value: vi.fn(() => [123, 123]) },
    getSize: { value: vi.fn(() => [800, 600]) },
    addLayer: { value: vi.fn((layer) => layers.push(layer)) },
    getLayers: {
      value: () => ({
        getArray: vi.fn(() => layers),
        getLength: vi.fn(() => layers.length),
        push: vi.fn((layer) => layers.push(layer)),
        item: vi.fn((index) => layers[index]),
        setAt: vi.fn((index, layer) => (layers[index] = layer)),
        clear: vi.fn(() => (layers.length = 0)),
      }),
    },
    render: { value: vi.fn() },
    getTargetElement: { value: vi.fn() },
  });
  // simulate hover feature initialization
  map.on("pointermove", () => {
    map.dispatchEvent({
      type: `${GEOSPATIAL_SDK_PREFIX}${FeaturesHoverEventType}`,
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

describe("event listener registration", () => {
  let map: OlMap;
  beforeEach(async () => {
    map = await createMap();
    vi.useFakeTimers();
    vi.clearAllMocks();
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
  describe("map view state change event", () => {
    let callback: Mock;

    beforeEach(() => {
      callback = vi.fn();
      listen(map, "map-view-state-change", callback);
    });

    it("tracks change in center, resolution & rotation", () => {
      map.getView().setCenter([1000, 1000]);
      map.getView().setResolution(100);
      map.getView().setRotation(Math.PI / 2);
      callback.mockReset();

      map.getView().setCenter([0, 0]);
      map.getView().dispatchEvent(createMapEvent(map, "change:center"));
      map.getView().dispatchEvent(createMapEvent(map, "change:resolution"));
      map.getView().dispatchEvent(createMapEvent(map, "change:rotation"));
      map.dispatchEvent(createMapEvent(map, "change:size"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-view-state-change",
        viewState: {
          center: [0, 0],
          bearing: 180,
          extent: [
            -0.26949458523585645, -0.3593237582430078, 0.26949458523585645,
            0.3593237582430078,
          ],
          resolution: 100,
          scaleDenominator: (100 * 1000) / 0.28, // metersPerUnit * resolution * (1000 / mmPerPixel)
        },
      });
    });
  });
  describe("map layer state change", () => {
    let callback: Mock;

    beforeEach(() => {
      callback = vi.fn();
      listen(map, "map-layer-state-change", callback);
    });

    describe("layer creation", () => {
      it("emits an error without layer index if something goes wrong when applying a context", async () => {
        await resetMapFromContext(map, {
          layers: [{ type: "doesnt-exist" } as any],
          view: null,
        });
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith({
          layerIndex: -1,
          layerState: {
            creationError: true,
            creationErrorMessage:
              'Error: Unrecognized layer type: {"type":"doesnt-exist"}',
          },
          type: "map-layer-state-change",
        });
      });
      it("emits an error without layer index if something goes wrong when applying a context diff", async () => {
        await applyContextDiffToMap(map, {
          layersAdded: [
            {
              layer: { type: "doesnt-exist" } as any,
              position: 3,
            },
          ],
          layersRemoved: [],
          layersReordered: [],
          layersChanged: [
            {
              // the change here needs a recreation of the layer
              layer: { type: "also-doesnt-exist" } as any,
              previousLayer: MAP_CTX_LAYER_GEOJSON_FIXTURE,
              position: 2,
            },
          ],
        });
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith({
          layerIndex: -1,
          layerState: {
            creationError: true,
            creationErrorMessage:
              'Error: Unrecognized layer type: {"type":"doesnt-exist"}',
          },
          type: "map-layer-state-change",
        });
        expect(callback).toHaveBeenCalledWith({
          layerIndex: -1,
          layerState: {
            creationError: true,
            creationErrorMessage:
              'Error: Unrecognized layer type: {"type":"also-doesnt-exist"}',
          },
          type: "map-layer-state-change",
        });
      });
      it("emits a status when everything worked well (context diff)", async () => {
        await resetMapFromContext(map, {
          layers: [MAP_CTX_LAYER_XYZ_FIXTURE],
          view: null,
        });
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 0,
          layerState: {
            created: true,
          },
          type: "map-layer-state-change",
        });
      });
      it("emits a status when everything works well (context diff)", async () => {
        await applyContextDiffToMap(map, {
          layersAdded: [
            {
              layer: MAP_CTX_LAYER_WMTS_FIXTURE,
              position: 3,
            },
          ],
          layersRemoved: [],
          layersReordered: [],
          layersChanged: [
            {
              // the change here needs a recreation of the layer
              layer: MAP_CTX_LAYER_WFS_FIXTURE,
              previousLayer: MAP_CTX_LAYER_GEOJSON_FIXTURE,
              position: 2,
            },
          ],
        });
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 3,
          layerState: {
            created: true,
          },
          type: "map-layer-state-change",
        });
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 2,
          layerState: {
            created: true,
          },
          type: "map-layer-state-change",
        });
      });
    });

    describe("layer loading & data info", () => {
      it("transmits updated layer state as they update", async () => {
        await resetMapFromContext(map, {
          layers: [MAP_CTX_LAYER_XYZ_FIXTURE, MAP_CTX_LAYER_WMS_FIXTURE],
          view: null,
        });
        callback.mockClear();

        const layer2 = map.getLayers().item(1);
        layer2.dispatchEvent({
          type: `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
          layerState: {
            loading: true,
          },
        } as unknown as BaseEvent);
        layer2.dispatchEvent({
          type: `${GEOSPATIAL_SDK_PREFIX}layer-data-info`,
          layerState: {
            geometryTypes: ["LineString"],
          },
        } as unknown as BaseEvent);
        layer2.dispatchEvent({
          type: `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
          layerState: {
            loaded: true,
          },
        } as unknown as BaseEvent);
        layer2.dispatchEvent({
          type: `${GEOSPATIAL_SDK_PREFIX}layer-data-info`,
          layerState: {
            featuresCount: 123,
          },
        } as unknown as BaseEvent);

        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenCalledWith({
          layerState: { created: true, loading: true },
          layerIndex: 1,
          type: "map-layer-state-change",
        });
        expect(callback).toHaveBeenCalledWith({
          layerState: {
            created: true,
            loading: true,
            geometryTypes: ["LineString"],
          },
          layerIndex: 1,
          type: "map-layer-state-change",
        });
        expect(callback).toHaveBeenCalledWith({
          layerState: {
            created: true,
            loaded: true,
            geometryTypes: ["LineString"],
          },
          layerIndex: 1,
          type: "map-layer-state-change",
        });
        expect(callback).toHaveBeenCalledWith({
          layerState: {
            created: true,
            loaded: true,
            geometryTypes: ["LineString"],
            featuresCount: 123,
          },
          layerIndex: 1,
          type: "map-layer-state-change",
        });
      });
    });
  });

  describe("map extent change event (deprecated)", () => {
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
      });
    });

    it("should registers the event on the map when resolution changed", () => {
      map.getView().dispatchEvent(createMapEvent(map, "change:resolution"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
      });
    });

    it("should registers the event on the map when rotation changed", () => {
      map.getView().dispatchEvent(createMapEvent(map, "change:rotation"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
      });
    });

    it("should registers the event on the map when size changed", () => {
      map.dispatchEvent(createMapEvent(map, "change:size"));

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        type: "map-extent-change",
        extent: EXPECTED_MAP_EXTENT_EPSG4326,
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
