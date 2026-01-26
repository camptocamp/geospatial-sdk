import type { Map as MapLibreMap, RasterLayerSpecification } from "maplibre-gl";
import { MapContextDiff, MapContextLayer } from "@geospatial-sdk/core";
import {
  SAMPLE_CONTEXT,
  SAMPLE_LAYER1,
  SAMPLE_LAYER2,
  SAMPLE_LAYER3,
  SAMPLE_LAYER4,
  SAMPLE_LAYER5,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import { applyContextDiffToMap } from "./apply-context-diff.js";
import { generateLayerHashWithoutUpdatableProps } from "../helpers/map.helpers.js";
import { resetMapFromContext } from "./create-map.js";

// Helper to create a fresh mock Map instance for each test
function createMockMap(): MapLibreMap {
  const state = {
    layers: [] as any[],
    source: {} as any,
  };
  return {
    addLayer: vi.fn((layer, beforeId) => {
      if (beforeId) {
        const beforeIndex = state.layers.findIndex(
          (layer) => layer.id === beforeId,
        );
        if (beforeIndex === -1) {
          throw new Error(
            "Could not add before non existent layer: " + beforeId,
          );
        }
        state.layers.splice(beforeIndex, 0, layer);
      } else {
        state.layers.push(layer);
      }
    }),
    addSource: vi.fn((sourceId, source) => {
      state.source[sourceId] = source;
    }),
    removeLayer: vi.fn((layerId) => {
      state.layers = state.layers.filter((layer) => layer.id !== layerId);
    }),
    removeSource: vi.fn((sourceId) => {
      delete state.source[sourceId];
    }),
    setZoom: vi.fn(),
    setCenter: vi.fn(),
    fitBounds: vi.fn(),
    getStyle: vi.fn(() => state),
    moveLayer: vi.fn((layerId, beforeId) => {
      const layerIndex = state.layers.findIndex(
        (layer) => layer.id === layerId,
      );
      const layer = state.layers[layerIndex];
      state.layers.splice(layerIndex, 1);
      if (beforeId) {
        const beforeIndex = state.layers.findIndex(
          (layer) => layer.id === beforeId,
        );
        if (beforeIndex === -1) {
          throw new Error(
            "Could not move before non existent layer: " + beforeId,
          );
        }
        state.layers.splice(beforeIndex, 0, layer);
      } else {
        state.layers.push(layer);
      }
    }),
    getLayer: vi.fn((layerId) => {
      return state.layers.find((layer) => layer.id === layerId);
    }),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
  } as unknown as MapLibreMap;
}

describe("applyContextDiffToMap (mocked Map)", () => {
  let diff: MapContextDiff;
  let map: ReturnType<typeof createMockMap>;

  beforeEach(async () => {
    map = createMockMap();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not call any mutating methods for no change", async () => {
    diff = {
      layersAdded: [],
      layersChanged: [],
      layersRemoved: [],
      layersReordered: [],
    };
    await applyContextDiffToMap(map, diff);
    expect(map.addLayer).not.toHaveBeenCalled();
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();
  });

  it("calls addLayer and addSource for layers added", async () => {
    diff = {
      layersAdded: [
        { layer: SAMPLE_LAYER3, position: 0 },
        { layer: SAMPLE_LAYER4, position: 2 },
      ],
      layersChanged: [],
      layersRemoved: [],
      layersReordered: [],
    };
    await applyContextDiffToMap(map, diff);
    expect(map.addSource).toHaveBeenCalled();
    expect(map.addLayer).toHaveBeenCalled();
  });

  it("calls removeLayer and removeSource for layers removed", async () => {
    const context = {
      ...SAMPLE_CONTEXT,
      layers: [SAMPLE_LAYER2, SAMPLE_LAYER1],
    };
    await resetMapFromContext(map, context);
    diff = {
      layersAdded: [],
      layersChanged: [],
      layersRemoved: [
        { layer: SAMPLE_LAYER2, position: 0 },
        { layer: SAMPLE_LAYER1, position: 1 },
      ],
      layersReordered: [],
    };
    const layer1: RasterLayerSpecification = map.getStyle()
      .layers[1] as RasterLayerSpecification;
    const layer2: RasterLayerSpecification = map.getStyle()
      .layers[0] as RasterLayerSpecification;
    await applyContextDiffToMap(map, diff);
    expect(map.removeLayer).toHaveBeenCalledWith(layer1.id);
    expect(map.removeLayer).toHaveBeenCalledWith(layer2.id);
    expect(map.removeSource).toHaveBeenCalledWith(layer1.source);
    expect(map.removeSource).toHaveBeenCalledWith(layer2.source);
  });

  describe("layer changes", () => {
    beforeEach(async () => {
      const context = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER3, SAMPLE_LAYER1],
      };
      await resetMapFromContext(map, context);
      vi.clearAllMocks();
    });

    it("replace layers when non-updatable properties are changed", async () => {
      const layer3Changed = {
        ...SAMPLE_LAYER3,
        data: '{ "type": "Feature", "properties": { "changed": true}}',
      } as MapContextLayer;
      const layer1Changed = {
        ...SAMPLE_LAYER1,
        url: "http://changed/",
        extras: { changed: true },
      };

      diff = {
        layersAdded: [],
        layersChanged: [
          {
            layer: layer3Changed,
            previousLayer: SAMPLE_LAYER3,
            position: 0,
          },
          {
            layer: layer1Changed,
            previousLayer: SAMPLE_LAYER1,
            position: 1,
          },
        ],
        layersRemoved: [],
        layersReordered: [],
      };
      await applyContextDiffToMap(map, diff);

      expect(map.addLayer).toHaveBeenCalledTimes(4); // 3 for vector layer, 1 for raster layer
      expect(map.removeLayer).toHaveBeenCalledTimes(4); // same as above

      expect(map.getStyle().layers.length).toBe(4);
      expect(map.getStyle().layers).toEqual([
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(layer3Changed),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(layer3Changed),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(layer3Changed),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(layer1Changed),
          },
        }),
      ]);
    });
    it("simply updates the layer if updatable properties are changed", async () => {
      diff = {
        layersAdded: [],
        layersChanged: [
          {
            layer: {
              ...SAMPLE_LAYER3,
              visibility: false,
            } as MapContextLayer,
            previousLayer: SAMPLE_LAYER3,
            position: 0,
          },
          {
            layer: {
              ...SAMPLE_LAYER1,
              opacity: 0.9,
              extras: { changed: true },
            },
            previousLayer: SAMPLE_LAYER1,
            position: 1,
          },
        ],
        layersRemoved: [],
        layersReordered: [],
      };
      await applyContextDiffToMap(map, diff);

      expect(map.setLayoutProperty).toHaveBeenCalledTimes(3); // 3 for vector layer
      expect(map.setPaintProperty).toHaveBeenCalledTimes(1);
      expect(map.addLayer).not.toHaveBeenCalled();
      expect(map.removeLayer).not.toHaveBeenCalled();

      expect(map.getStyle().layers.length).toBe(4);
      expect(map.getStyle().layers).toEqual([
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER1),
          },
        }),
      ]);
    });
  });

  it("calls fitBounds for viewChanges with extent", async () => {
    diff = {
      layersAdded: [],
      layersChanged: [],
      layersRemoved: [],
      layersReordered: [],
      viewChanges: { extent: [-10, -10, 20, 20] },
    };
    await applyContextDiffToMap(map, diff);
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-10, -10],
        [20, 20],
      ],
      expect.objectContaining({ padding: 20, duration: 1000 }),
    );
  });

  describe("reordering", () => {
    describe("2 layers inverted", () => {
      beforeEach(async () => {
        const context = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER1, SAMPLE_LAYER3, SAMPLE_LAYER2],
        };
        await resetMapFromContext(map, context);
        vi.clearAllMocks();

        diff = {
          layersAdded: [],
          layersChanged: [],
          layersRemoved: [],
          layersReordered: [
            {
              layer: SAMPLE_LAYER2,
              newPosition: 0,
              previousPosition: 2,
            },
            {
              layer: SAMPLE_LAYER1,
              newPosition: 2,
              previousPosition: 0,
            },
          ],
        };
        await applyContextDiffToMap(map, diff);
      });
      it("moves the layers accordingly", () => {
        expect(map.getStyle().layers.length).toBe(5);
        expect(map.getStyle().layers).toEqual([
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER2),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER1),
            },
          }),
        ]);
      });
    });
    describe("4 layers moved", () => {
      let layer1WithId: MapContextLayer;

      beforeEach(async () => {
        layer1WithId = {
          ...SAMPLE_LAYER1,
          id: "layer-1-id",
        };
        const context = {
          ...SAMPLE_CONTEXT,
          layers: [layer1WithId, SAMPLE_LAYER3, SAMPLE_LAYER4, SAMPLE_LAYER2],
        };
        await resetMapFromContext(map, context);
        vi.clearAllMocks();

        diff = {
          layersAdded: [],
          layersChanged: [],
          layersRemoved: [],
          layersReordered: [
            {
              layer: SAMPLE_LAYER3,
              newPosition: 3,
              previousPosition: 1,
            },
            {
              layer: SAMPLE_LAYER2,
              newPosition: 2,
              previousPosition: 3,
            },
            {
              layer: layer1WithId,
              newPosition: 1,
              previousPosition: 0,
            },
            {
              layer: SAMPLE_LAYER4,
              newPosition: 0,
              previousPosition: 2,
            },
          ],
        };
        await applyContextDiffToMap(map, diff);
      });
      it("moves the layers accordingly", () => {
        expect(map.getStyle().layers.length).toBe(8);
        expect(map.getStyle().layers).toEqual([
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER4),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER4),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER4),
            },
          }),
          expect.objectContaining({
            metadata: { layerId: layer1WithId.id },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER2),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
            },
          }),
          expect.objectContaining({
            metadata: {
              layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER3),
            },
          }),
        ]);
      });
    });
  });

  describe("combined changes", () => {
    let changedLayer: MapContextLayer;
    beforeEach(async () => {
      changedLayer = { ...SAMPLE_LAYER3, extras: { prop: true } };
      const context = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER5, SAMPLE_LAYER3, SAMPLE_LAYER4],
      };
      await resetMapFromContext(map, context);
      vi.clearAllMocks();

      diff = {
        layersAdded: [
          {
            layer: SAMPLE_LAYER2,
            position: 0,
          },
        ],
        layersChanged: [
          {
            layer: changedLayer,
            previousLayer: SAMPLE_LAYER3,
            position: 1,
          },
        ],
        layersRemoved: [
          {
            layer: SAMPLE_LAYER1,
            position: 0,
          },
          {
            layer: SAMPLE_LAYER4,
            position: 3,
          },
        ],
        layersReordered: [
          {
            layer: changedLayer,
            newPosition: 1,
            previousPosition: 2,
          },
          {
            layer: SAMPLE_LAYER5,
            newPosition: 2,
            previousPosition: 1,
          },
        ],
      };
      await applyContextDiffToMap(map, diff);
    });

    it("moves the layers accordingly", () => {
      expect(map.getStyle().layers.length).toBe(5);
      expect(map.getStyle().layers).toEqual([
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER2),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(changedLayer),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(changedLayer),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(changedLayer),
          },
        }),
        expect.objectContaining({
          metadata: {
            layerHash: generateLayerHashWithoutUpdatableProps(SAMPLE_LAYER5),
          },
        }),
      ]);
    });
  });
});
