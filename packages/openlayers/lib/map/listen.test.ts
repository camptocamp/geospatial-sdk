import OlMap, { FrameState } from "ol/Map.js";
import { afterAll, beforeEach, Mock } from "vitest";
import { listen } from "./listen.js";
import TileQueue, { getTilePriority } from "ol/TileQueue.js";
import View from "ol/View.js";
import Collection from "ol/Collection.js";
import { get as getProjection, toLonLat } from "ol/proj.js";
import {
  FeaturesHoverEventType,
  SourceLoadErrorEvent,
} from "@geospatial-sdk/core";
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
import { propagateLayerStateChangeEventToMap } from "./register-events.js";
import MapBrowserEvent from "ol/MapBrowserEvent.js";
import BaseObject from "ol/Object.js";
import Layer from "ol/layer/Layer.js";
import { EndpointError } from "@camptocamp/ogc-client";

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
  const layers = new Collection([layer1, layer2, layer3]);
  const map = new BaseObject() as OlMap;
  Object.defineProperties(map, {
    getView: { value: vi.fn(() => view) },
    setView: { value: vi.fn() },
    getEventPixel: { value: vi.fn(() => [10, 10]) },
    getCoordinateFromPixel: { value: vi.fn(() => [123, 123]) },
    getSize: { value: vi.fn(() => [800, 600]) },
    addLayer: { value: vi.fn((layer) => layers.push(layer)) },
    getLayers: {
      value: () => layers,
    },
    render: { value: vi.fn() },
    getTargetElement: { value: vi.fn() },
  });
  propagateLayerStateChangeEventToMap(map, layer1);
  propagateLayerStateChangeEventToMap(map, layer2);
  propagateLayerStateChangeEventToMap(map, layer3);

  // simulate hover feature initialization
  map.on("pointermove", () => {
    map.dispatchEvent({
      type: `${GEOSPATIAL_SDK_PREFIX}${FeaturesHoverEventType}`,
      features: [featureB],
      featuresByLayer: new Map([[0, [featureB]]]),
    } as unknown as BaseEvent);
  });

  // wait out all pending timers
  await vi.runAllTimersAsync();
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
    vi.useFakeTimers();
    map = await createMap();
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
        await vi.runAllTimersAsync();

        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 0,
          layerState: {
            creationError: true,
            creationErrorMessage:
              'Unrecognized layer type: {"type":"doesnt-exist"}',
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
        await vi.runAllTimersAsync();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 3,
          layerState: {
            creationError: true,
            creationErrorMessage:
              'Unrecognized layer type: {"type":"doesnt-exist"}',
          },
          type: "map-layer-state-change",
        });
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 2,
          layerState: {
            creationError: true,
            creationErrorMessage:
              'Unrecognized layer type: {"type":"also-doesnt-exist"}',
          },
          type: "map-layer-state-change",
        });
      });
      it("emits a status when everything worked well (context diff)", async () => {
        await resetMapFromContext(map, {
          layers: [MAP_CTX_LAYER_XYZ_FIXTURE],
          view: null,
        });
        await vi.runAllTimersAsync();

        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 0,
          layerState: {
            created: true,
            loaded: true,
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
        await vi.runAllTimersAsync();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 3,
          layerState: {
            created: true,
            loaded: true,
          },
          type: "map-layer-state-change",
        });
        expect(callback).toHaveBeenCalledWith({
          layerIndex: 2,
          layerState: {
            created: true,
            loaded: true,
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
        await vi.runAllTimersAsync();
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

  describe("layer creation error", () => {
    let callback: Mock;

    beforeEach(() => {
      callback = vi.fn();
      listen(map, "layer-creation-error", callback);
    });

    it("emits an error if something goes wrong when applying a context", async () => {
      await resetMapFromContext(map, {
        layers: [{ type: "doesnt-exist" } as any],
        view: null,
      });
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith({
        error: new Error('Unrecognized layer type: {"type":"doesnt-exist"}'),
        type: "layer-creation-error",
      });
    });
    it("emits an error if something goes wrong when applying a context diff", async () => {
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
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith({
        error: new Error('Unrecognized layer type: {"type":"doesnt-exist"}'),
        type: "layer-creation-error",
      });
      expect(callback).toHaveBeenCalledWith({
        error: new Error(
          'Unrecognized layer type: {"type":"also-doesnt-exist"}',
        ),
        type: "layer-creation-error",
      });
    });
  });

  describe("layer loading error", () => {
    let errorEventCallback: Mock;
    let mapStateCallback: Mock;
    let sourceLoadErrorCallback: Mock;
    let fetchMock: Mock;
    let layer: Layer;
    const mockCanvas = document.createElement("canvas");

    const getFrameState = (layer: Layer): FrameState => {
      const frameState = {
        animate: false,
        coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
        declutterItems: [],
        extent: [
          -696165.0132013096, 5090855.383524774, 3367832.7922398755,
          7122854.286245367,
        ],
        index: 0,
        layerIndex: 0,
        pixelRatio: 1,
        pixelToCoordinateTransform: [1, 0, 0, 1, 0, 0],
        postRenderFunctions: [],
        size: [800, 400],
        time: 1604056713131,
        usedTiles: {},
        wantedTiles: {},
        viewHints: [0, 0],
        viewState: {
          center: [0, 0],
          resolution: 5079.997256801481,
          projection: getProjection("EPSG:3857"),
          rotation: 0,
        },
        layerStatesArray: [
          {
            layer,
            managed: true,
            maxResolution: null,
            maxZoom: null,
            minResolution: 0,
            minZoom: null,
            opacity: 1,
            sourceState: "",
            visible: true,
            zIndex: 0,
          },
        ],
        tileQueue: new TileQueue(
          (tile, tileSourceKey, tileCenter, tileResolution) =>
            getTilePriority(
              frameState,
              tile,
              tileSourceKey,
              tileCenter,
              tileResolution,
            ),
          () => {},
        ),
      } as unknown as FrameState;
      return frameState;
    };

    beforeAll(() => {
      fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockImplementation((input, _options) => {
          if (input.toString().includes("give.me/network/error")) {
            return Promise.reject(new Error("Network error"));
          }
          if (input.toString().includes("give.me/http/error")) {
            return Promise.resolve(
              new Response("An error happened on this tile", {
                status: 403,
                statusText: "Some HTTP error",
              }),
            );
          }
          return Promise.resolve(
            new Response("fake image blob", { status: 200 }),
          );
        });
    });

    afterAll(() => {
      fetchMock.mockRestore();
    });

    beforeEach(() => {
      errorEventCallback = vi.fn();
      mapStateCallback = vi.fn();
      sourceLoadErrorCallback = vi.fn();
      listen(map, "layer-loading-error", errorEventCallback);
      listen(map, "map-state-change", mapStateCallback);
      listen(map, "source-load-error", sourceLoadErrorCallback);
    });

    describe("WMTS endpoint error", () => {
      beforeEach(async () => {
        layer = await createLayer({
          type: "wmts",
          url: "http://give.me/error",
          name: "abcd",
        });
        map.getLayers().setAt(0, layer);
        propagateLayerStateChangeEventToMap(map, layer);
        await vi.runAllTimersAsync();
      });
      it("emits an error", async () => {
        expect(errorEventCallback).toHaveBeenCalledOnce();
        expect(errorEventCallback).toHaveBeenCalledWith({
          error: new EndpointError("Something went wrong", 305),
          type: "layer-loading-error",
          httpStatus: 305,
        });
      });
      it("updates the map state accordingly", async () => {
        expect(mapStateCallback).toHaveBeenLastCalledWith({
          type: "map-state-change",
          mapState: {
            layers: [
              {
                created: true,
                loadingError: true,
                loadingErrorHttpStatus: 305,
                loadingErrorMessage: "Something went wrong",
              },
              null,
              null,
            ],
            view: null,
          },
        });
      });
      it("DEPRECATED: emits a source load error", async () => {
        expect(sourceLoadErrorCallback).toHaveBeenCalledOnce();
        expect(sourceLoadErrorCallback).toHaveBeenCalledWith(
          new SourceLoadErrorEvent(
            new EndpointError("Something went wrong", 305),
          ),
        );
      });
    });

    describe("WFS endpoint error", () => {
      beforeEach(async () => {
        layer = await createLayer({
          type: "wfs",
          url: "http://give.me/error",
          featureType: "abcd",
        });
        map.getLayers().setAt(0, layer);
        propagateLayerStateChangeEventToMap(map, layer);
        await vi.runAllTimersAsync();
      });
      it("emits an error", async () => {
        expect(errorEventCallback).toHaveBeenCalledOnce();
        expect(errorEventCallback).toHaveBeenCalledWith({
          error: new EndpointError("Something went wrong", 305),
          type: "layer-loading-error",
          httpStatus: 305,
        });
      });
      it("updates the map state accordingly", async () => {
        expect(mapStateCallback).toHaveBeenLastCalledWith({
          type: "map-state-change",
          mapState: {
            layers: [
              {
                created: true,
                loadingError: true,
                loadingErrorHttpStatus: 305,
                loadingErrorMessage: "Something went wrong",
              },
              null,
              null,
            ],
            view: null,
          },
        });
      });
      it("DEPRECATED: emits a source load error", async () => {
        expect(sourceLoadErrorCallback).toHaveBeenCalledOnce();
        expect(sourceLoadErrorCallback).toHaveBeenCalledWith(
          new SourceLoadErrorEvent(
            new EndpointError("Something went wrong", 305),
          ),
        );
      });
    });

    describe("Tile loading HTTP error", () => {
      beforeEach(async () => {
        layer = await createLayer({
          type: "xyz",
          url: "http://give.me/http/error",
        });
        map.getLayers().setAt(0, layer);
        propagateLayerStateChangeEventToMap(map, layer);
        await vi.runAllTimersAsync();

        // this will trigger tile loading
        const frameState = getFrameState(layer);
        layer.render(frameState, mockCanvas);
        frameState.tileQueue.loadMoreTiles(1, 1);
        layer.render(frameState, mockCanvas);
      });
      it("emits an error", async () => {
        expect(errorEventCallback).toHaveBeenCalledOnce();
        expect(errorEventCallback).toHaveBeenCalledWith({
          error: new Error("Some HTTP error"),
          type: "layer-loading-error",
          httpStatus: 403,
        });
      });
      it("updates the map state accordingly", async () => {
        expect(mapStateCallback).toHaveBeenLastCalledWith({
          type: "map-state-change",
          mapState: {
            layers: [
              {
                created: true,
                loadingError: true,
                loadingErrorHttpStatus: 403,
                loadingErrorMessage: "Some HTTP error",
              },
              null,
              null,
            ],
            view: null,
          },
        });
      });
      it("DEPRECATED: emits a source load error", async () => {
        expect(sourceLoadErrorCallback).toHaveBeenCalledOnce();
        expect(sourceLoadErrorCallback).toHaveBeenCalledWith(
          new SourceLoadErrorEvent(new EndpointError("Some HTTP error", 403)),
        );
      });
    });

    describe("Tile loading network error", () => {
      beforeEach(async () => {
        layer = await createLayer({
          type: "xyz",
          url: "http://give.me/network/error",
        });
        map.getLayers().setAt(0, layer);
        propagateLayerStateChangeEventToMap(map, layer);
        await vi.runAllTimersAsync();

        // this will trigger tile loading
        const frameState = getFrameState(layer);
        layer.render(frameState, mockCanvas);
        frameState.tileQueue.loadMoreTiles(1, 1);
        layer.render(frameState, mockCanvas);
      });
      it("emits an error", async () => {
        expect(errorEventCallback).toHaveBeenCalledOnce();
        expect(errorEventCallback).toHaveBeenCalledWith({
          error: new Error("Network error"),
          type: "layer-loading-error",
        });
      });
      it("updates the map state accordingly", async () => {
        expect(mapStateCallback).toHaveBeenLastCalledWith({
          type: "map-state-change",
          mapState: {
            layers: [
              {
                created: true,
                loadingError: true,
                loadingErrorMessage: "Network error",
              },
              null,
              null,
            ],
            view: null,
          },
        });
      });
      it("DEPRECATED: emits a source load error", async () => {
        expect(sourceLoadErrorCallback).toHaveBeenCalledOnce();
        expect(sourceLoadErrorCallback).toHaveBeenCalledWith(
          new SourceLoadErrorEvent(new Error("Network error")),
        );
      });
    });
  });

  describe("global map state change", () => {
    let callback: Mock;

    beforeEach(async () => {
      // we're skipping all the initial events in order to track only the ones we control
      await vi.runAllTimersAsync();
      callback = vi.fn();
      listen(map, "map-state-change", callback);
    });

    it("emits an updated state after changes to layers and view", async () => {
      map
        .getLayers()
        .item(0)
        .dispatchEvent({
          type: `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
          layerState: {
            loading: true,
          },
        } as unknown as BaseEvent);
      map
        .getLayers()
        .item(1)
        .dispatchEvent({
          type: `${GEOSPATIAL_SDK_PREFIX}layer-data-info`,
          layerState: {
            featuresCount: 123,
          },
        } as unknown as BaseEvent);
      map.getView().setCenter([0, 0]);
      map.getView().dispatchEvent(createMapEvent(map, "change:center"));

      expect(callback).toHaveBeenCalledTimes(3); // 1 per each layer + 1 for the view
      expect(callback).toHaveBeenLastCalledWith({
        type: "map-state-change",
        mapState: {
          layers: [
            {
              created: true,
              loading: true,
            },
            {
              created: true,
              featuresCount: 123,
              loaded: true,
            },
            null,
          ],
          view: {
            bearing: 90,
            center: [0, 0],
            extent: [
              -0.0035932611364780857, -0.0026949458513598756,
              0.0035932611364780857, 0.0026949458513740865,
            ],
            resolution: 1,
            scaleDenominator: 3571.428571428571,
          },
        },
      });
    });

    it("emits a new state when layers are deleted/changed", async () => {
      await applyContextDiffToMap(map, {
        layersAdded: [],
        layersRemoved: [
          {
            layer: MAP_CTX_LAYER_WMTS_FIXTURE,
            position: 2,
          },
        ],
        layersReordered: [],
        layersChanged: [
          {
            layer: MAP_CTX_LAYER_WFS_FIXTURE,
            previousLayer: MAP_CTX_LAYER_GEOJSON_FIXTURE,
            position: 1,
          },
        ],
      });
      await vi.runAllTimersAsync();

      expect(callback).toHaveBeenLastCalledWith({
        type: "map-state-change",
        mapState: {
          layers: [
            null,
            {
              // this is the new WFS layer
              created: true,
              loaded: true,
            },
          ],
          view: null,
        },
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
