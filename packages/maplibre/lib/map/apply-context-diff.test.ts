import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapContext, MapContextDiff } from "@geospatial-sdk/core";
import {
  SAMPLE_CONTEXT,
  SAMPLE_LAYER1,
  SAMPLE_LAYER2,
  SAMPLE_LAYER3,
  SAMPLE_LAYER4,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures";
import { applyContextDiffToMap } from "./apply-context-diff";
import * as mapHelpers from "../helpers/map.helpers";
import { getBeforeId } from "../helpers/map.helpers";

// Helper to create a fresh mock Map instance for each test
function createMockMap() {
  return {
    addLayer: vi.fn(),
    addSource: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    setZoom: vi.fn(),
    setCenter: vi.fn(),
    fitBounds: vi.fn(),
    getStyle: vi.fn(() => ({ layers: [], sources: {} })),
  };
}

describe("applyContextDiffToMap (mocked Map)", () => {
  let context: MapContext;
  let diff: MapContextDiff;
  let map: ReturnType<typeof createMockMap>;

  beforeEach(async () => {
    context = {
      ...SAMPLE_CONTEXT,
      layers: [SAMPLE_LAYER2, SAMPLE_LAYER1],
    };
    map = createMockMap();
    map.getStyle.mockReturnValue({ layers: [], sources: {} });
  });

  it("does not call any mutating methods for no change", async () => {
    diff = {
      layersAdded: [],
      layersChanged: [],
      layersRemoved: [],
      layersReordered: [],
    };
    await applyContextDiffToMap(map as any, diff);
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
    await applyContextDiffToMap(map as any, diff);
    expect(map.addSource).toHaveBeenCalled();
    expect(map.addLayer).toHaveBeenCalled();
  });

  it("calls removeLayer and removeSource for layers removed", async () => {
    // Simulate getLayersAtPosition returning a mock layer with id/source
    const mockLayer = { id: "layerid", source: "sourceid" };
    vi.spyOn(mapHelpers, "getLayersAtPosition").mockReturnValue([mockLayer]);
    diff = {
      layersAdded: [],
      layersChanged: [],
      layersRemoved: [
        { layer: SAMPLE_LAYER2, position: 0 },
        { layer: SAMPLE_LAYER1, position: 1 },
      ],
      layersReordered: [],
    };
    await applyContextDiffToMap(map as any, diff);
    expect(map.removeLayer).toHaveBeenCalledWith("layerid");
    expect(map.removeSource).toHaveBeenCalledWith("sourceid");
  });

  it("calls addLayer for changed layers", async () => {
    const generateLayerIdSpy = vi
      .spyOn(mapHelpers, "generateLayerId")
      .mockReturnValue("azreza");
    const getBeforeId = vi
      .spyOn(mapHelpers, "getBeforeId")
      .mockReturnValue("azreza");
    const removeLayersFromSourceSpy = vi.spyOn(
      mapHelpers,
      "removeLayersFromSource",
    );

    diff = {
      layersAdded: [],
      layersChanged: [
        { layer: { ...SAMPLE_LAYER3, url: "http://changed/" }, position: 0 },
        {
          layer: {
            ...SAMPLE_LAYER1,
            url: "http://changed/",
            extras: { changed: true },
          },
          position: 1,
        },
      ],
      layersRemoved: [],
      layersReordered: [],
    };
    await applyContextDiffToMap(map as any, diff);

    try {
      expect(generateLayerIdSpy).toHaveBeenCalledWith(
        diff.layersChanged[1].layer,
      );
      expect(generateLayerIdSpy).toHaveBeenCalledWith(
        diff.layersChanged[0].layer,
      );
      expect(map.addLayer).toHaveBeenCalled();
      expect(removeLayersFromSourceSpy).toHaveBeenCalled();
      expect(removeLayersFromSourceSpy).toHaveBeenCalledTimes(2);
    } finally {
      generateLayerIdSpy.mockRestore();
      removeLayersFromSourceSpy.mockRestore();
    }
  });

  it("calls fitBounds for viewChanges with extent", async () => {
    diff = {
      layersAdded: [],
      layersChanged: [],
      layersRemoved: [],
      layersReordered: [],
      viewChanges: { extent: [-10, -10, 20, 20] },
    };
    await applyContextDiffToMap(map as any, diff);
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-10, -10],
        [20, 20],
      ],
      expect.objectContaining({ padding: 20, duration: 1000 }),
    );
  });
});
