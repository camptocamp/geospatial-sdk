import { MapContext } from "@geospatial-sdk/core";
import {
  MAP_CTX_EXTENT_FIXTURE,
  MAP_CTX_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
  MAP_CTX_LAYER_XYZ_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import Map from "ol/Map.js";
import View from "ol/View.js";
import { beforeEach } from "vitest";
import {
  createMapFromContext,
  createView,
  getMapUpdatesPromise,
  resetMapFromContext,
} from "./create-map.js";

vi.mock("./handle-errors", async (importOriginal) => {
  const actual =
    (await importOriginal()) as typeof import("./handle-errors.js");
  return {
    ...actual,
    tileLoadErrorCatchFunction: vi.fn(),
    handleEndpointError: vi.fn(),
  };
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

describe("createView", () => {
  let view: View;
  let map: Map;
  describe("from center and zoom", () => {
    const contextModel = MAP_CTX_FIXTURE;
    beforeEach(async () => {
      map = createMapFromContext(contextModel);
      await getMapUpdatesPromise(map);
      view = createView(contextModel.view, map);
    });
    it("create a view", () => {
      expect(view).toBeTruthy();
      expect(view).toBeInstanceOf(View);
    });
    it("set center", () => {
      const center = view.getCenter();
      expect(center).toEqual([862726.0536478702, 6207260.308175252]);
    });
    it("set zoom", () => {
      const zoom = view.getZoom();
      expect(zoom).toEqual(contextModel.view.zoom);
    });
  });
  describe("from extent", () => {
    const contextModel = {
      ...MAP_CTX_FIXTURE,
      view: { ...MAP_CTX_FIXTURE.view, extent: MAP_CTX_EXTENT_FIXTURE },
    };
    const map = new Map({});
    map.setSize([100, 100]);
    beforeEach(() => {
      view = createView(contextModel.view, map);
    });
    it("create a view", () => {
      expect(view).toBeTruthy();
      expect(view).toBeInstanceOf(View);
    });
    it("set center", () => {
      const center = view.getCenter();
      expect(center).toEqual([317260.5487608297, 6623200.647707232]);
    });
    it("set zoom", () => {
      const zoom = view.getZoom();
      expect(zoom).toEqual(5);
    });
  });
});

describe("resetMapFromContext", () => {
  let map: Map;
  beforeEach(async () => {
    map = new Map({});
    const mapContext = MAP_CTX_FIXTURE;
    resetMapFromContext(map, mapContext);
    await getMapUpdatesPromise(map);
  });
  it("create a map", () => {
    expect(map).toBeTruthy();
    expect(map).toBeInstanceOf(Map);
  });
  it("add layers", () => {
    const layers = map.getLayers().getArray();
    expect(layers.length).toEqual(3);
  });
  it("set view", () => {
    const view = map.getView();
    expect(view).toBeTruthy();
    expect(view).toBeInstanceOf(View);
  });
  describe("uses default fallback view", () => {
    let view: View;
    let map: Map;
    beforeEach(async () => {
      map = new Map({});
      const mapContext: MapContext = {
        view: null,
        layers: [
          MAP_CTX_LAYER_XYZ_FIXTURE,
          MAP_CTX_LAYER_WMS_FIXTURE,
          MAP_CTX_LAYER_GEOJSON_FIXTURE,
        ],
      };
      resetMapFromContext(map, mapContext);
      await getMapUpdatesPromise(map);
    });
    it("create a map", () => {
      expect(map).toBeTruthy();
      expect(map).toBeInstanceOf(Map);
    });
    it("add layers", () => {
      const layers = map.getLayers().getArray();
      expect(layers.length).toEqual(3);
    });
    it("set view", () => {
      view = map.getView();
      expect(view).toBeTruthy();
      expect(view).toBeInstanceOf(View);
    });
    it("set center", () => {
      const center = view.getCenter();
      expect(center).toEqual([0, 0]);
    });
    it("set zoom", () => {
      const zoom = view.getZoom();
      expect(zoom).toEqual(0);
    });
  });
});
