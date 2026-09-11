import { beforeEach, describe, expect, it } from "vitest";
import { buildWmsParams, createWmsLayer, updateWmsLayerParams } from "./wms.js";
import { MapContextLayerWms } from "@geospatial-sdk/core";
import { createLayer } from "../layer-creation.js";
import { GEOSPATIAL_SDK_PREFIX } from "../constants.js";
import { MAP_CTX_LAYER_WMS_FIXTURE } from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import ImageTile from "ol/ImageTile.js";
import Layer from "ol/layer/Layer.js";
import TileLayer from "ol/layer/Tile.js";
import TileWMS from "ol/source/TileWMS.js";
import ImageWMS from "ol/source/ImageWMS.js";
import TileState from "ol/TileState.js";
import { tileLoadErrorCatchFunction } from "../handle-errors.js";
import ImageLayer from "ol/layer/Image.js";

vi.mock("../handle-errors", async (importOriginal) => {
  const actual =
    (await importOriginal()) as typeof import("../handle-errors.js");
  return {
    ...actual,
    tileLoadErrorCatchFunction: vi.fn(),
    handleEndpointError: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

describe("createWmsLayer", () => {
  let layerModel: MapContextLayerWms;
  let layer: Layer;
  const eventCallback = vi.fn();

  beforeEach(async () => {
    layerModel = MAP_CTX_LAYER_WMS_FIXTURE;
    layer = createWmsLayer(layerModel);
    layer.on(`${GEOSPATIAL_SDK_PREFIX}layer-loading-status`, eventCallback);
    layer.on(`${GEOSPATIAL_SDK_PREFIX}layer-data-info`, eventCallback);
  });
  it("create a tile layer", () => {
    expect(layer).toBeTruthy();
    expect(layer).toBeInstanceOf(TileLayer);
  });
  it("set correct layer properties", () => {
    expect(layer.getVisible()).toBe(false);
    expect(layer.getOpacity()).toBe(0.5);
    expect(layer.get("label")).toBe("Communes");
    // @ts-expect-error TS2554 we're not providing a view extent here
    expect(layer.getSource()?.getAttributions()!()).toEqual(["camptocamp"]);
  });
  it("create a TileWMS source", () => {
    const source = layer.getSource();
    expect(source).toBeInstanceOf(TileWMS);
  });
  it("set correct WMS params", () => {
    const source = layer.getSource() as TileWMS;
    const params = source.getParams();
    expect(params).toEqual({
      LAYERS: (layerModel as MapContextLayerWms).name,
      STYLES: (layerModel as MapContextLayerWms).style,
      TILED: true,
    });
  });
  it("sets custom WMS FORMAT param when provided", async () => {
    layerModel = { ...MAP_CTX_LAYER_WMS_FIXTURE, format: "image/jpeg" };
    layer = await createLayer(layerModel);
    const source = layer.getSource() as TileWMS;
    const params = source.getParams();
    expect(params).toEqual({
      LAYERS: (layerModel as MapContextLayerWms).name,
      FORMAT: "image/jpeg",
      STYLES: (layerModel as MapContextLayerWms).style,
      TILED: true,
    });
  });
  it("sets WMS dimension params with uppercased keys and ISO Date values", async () => {
    layerModel = {
      ...MAP_CTX_LAYER_WMS_FIXTURE,
      timeValue: "2020-01-01T00:00:00Z",
      elevationValue: 500,
      otherDimensionValues: {
        temperature: ["200K", "250K"],
        otherTime1: "current",
        otherTime2: "2024-01-04",
      },
    };
    layer = await createLayer(layerModel);
    const source = layer.getSource() as TileWMS;
    const params = source.getParams();
    expect(params).toEqual({
      LAYERS: (layerModel as MapContextLayerWms).name,
      STYLES: (layerModel as MapContextLayerWms).style,
      TILED: true,
      TIME: "2020-01-01T00:00:00Z",
      ELEVATION: "500",
      DIM_TEMPERATURE: "200K,250K",
      DIM_OTHERTIME1: "current",
      DIM_OTHERTIME2: "2024-01-04",
    });
  });
  it("set correct url without existing REQUEST and SERVICE params", () => {
    const source = layer.getSource() as TileWMS;
    const urls = source.getUrls() || [];
    expect(urls.length).toBe(1);
    expect(urls[0]).toBe(
      "https://www.datagrandest.fr/geoserver/region-grand-est/ows",
    );
  });
  it("set WMS gutter of 20px", () => {
    const source = layer.getSource() as TileWMS;
    const gutter = source["gutter_"];
    expect(gutter).toBe(20);
  });
  it("should set tileLoadErrorCatchFunction to handle errors", () => {
    const source = layer.getSource() as TileWMS;
    const tileLoadFunction = source.getTileLoadFunction();
    expect(tileLoadFunction).toBeInstanceOf(Function);
    const tile = new ImageTile([0, 0, 0], TileState.IDLE, "", null, () => {});
    tileLoadFunction(tile, "http://example.com/tile");
    expect(tileLoadErrorCatchFunction).toHaveBeenCalled();
  });

  it("emits a loaded event initially", async () => {
    await vi.runAllTimersAsync();
    expect(eventCallback).toHaveBeenCalledWith({
      layerState: {
        loaded: true,
      },
      target: layer,
      type: `${GEOSPATIAL_SDK_PREFIX}layer-loading-status`,
    });
  });

  describe("not using tiles", () => {
    beforeEach(async () => {
      layerModel = { ...MAP_CTX_LAYER_WMS_FIXTURE, useTiles: false };
      layer = await createLayer(layerModel);
      layer.on(`${GEOSPATIAL_SDK_PREFIX}layer-loading-status`, eventCallback);
      layer.on(`${GEOSPATIAL_SDK_PREFIX}layer-data-info`, eventCallback);
    });
    it("create an image layer", () => {
      expect(layer).toBeTruthy();
      expect(layer).toBeInstanceOf(ImageLayer);
    });
    it("set correct layer properties", () => {
      expect(layer.getVisible()).toBe(false);
      expect(layer.getOpacity()).toBe(0.5);
      expect(layer.get("label")).toBe("Communes");
      // @ts-expect-error TS2554 we're not providing a view extent here
      expect(layer.getSource()?.getAttributions()!()).toEqual(["camptocamp"]);
    });
    it("create an ImageWMS source", () => {
      const source = layer.getSource();
      expect(source).toBeInstanceOf(ImageWMS);
    });
    it("set correct WMS params", () => {
      const source = layer.getSource() as ImageWMS;
      const params = source.getParams();
      expect(params).toEqual({
        LAYERS: (layerModel as MapContextLayerWms).name,
        STYLES: (layerModel as MapContextLayerWms).style,
      });
    });
    it("sets custom WMS FORMAT param when provided", async () => {
      layerModel = {
        ...MAP_CTX_LAYER_WMS_FIXTURE,
        useTiles: false,
        format: "image/jpeg",
      };
      layer = await createLayer(layerModel);
      const source = layer.getSource() as ImageWMS;
      const params = source.getParams();
      expect(params).toEqual({
        LAYERS: (layerModel as MapContextLayerWms).name,
        FORMAT: "image/jpeg",
        STYLES: (layerModel as MapContextLayerWms).style,
      });
    });
    it("sets the WMS FILTER param when provided", async () => {
      const filter = "<Filter><PropertyIsEqualTo></PropertyIsEqualTo></Filter>";
      layerModel = { ...MAP_CTX_LAYER_WMS_FIXTURE, filter };
      layer = await createLayer(layerModel);
      const source = layer.getSource() as TileWMS;
      const params = source.getParams();
      expect(params).toEqual({
        LAYERS: (layerModel as MapContextLayerWms).name,
        STYLES: (layerModel as MapContextLayerWms).style,
        FILTER: filter,
        TILED: true,
      });
    });
    it("set correct url without existing REQUEST and SERVICE params", () => {
      const source = layer.getSource() as ImageWMS;
      const url = source.getUrl();
      expect(url).toBe(
        "https://www.datagrandest.fr/geoserver/region-grand-est/ows",
      );
    });
  });
});

describe("buildWmsParams", () => {
  it("includes LAYERS from layer name", () => {
    expect(buildWmsParams(MAP_CTX_LAYER_WMS_FIXTURE)).toEqual({
      STYLES: "default",
      LAYERS: "commune_actuelle_3857",
    });
  });

  it("includes FORMAT when set", () => {
    expect(
      buildWmsParams({ ...MAP_CTX_LAYER_WMS_FIXTURE, format: "image/png" }),
    ).toEqual({
      STYLES: "default",
      LAYERS: "commune_actuelle_3857",
      FORMAT: "image/png",
    });
  });

  it("omits FORMAT when not set", () => {
    expect(buildWmsParams(MAP_CTX_LAYER_WMS_FIXTURE)).not.toHaveProperty(
      "FORMAT",
    );
  });

  it("includes STYLES when set", () => {
    expect(
      buildWmsParams({
        ...MAP_CTX_LAYER_WMS_FIXTURE,
        style: "boxfill/rainbow",
      }),
    ).toMatchObject({ STYLES: "boxfill/rainbow" });
  });

  it("omits STYLES when not set", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { style, ...withoutStyle } = MAP_CTX_LAYER_WMS_FIXTURE;
    expect(buildWmsParams(withoutStyle)).not.toHaveProperty("STYLES");
  });

  describe("dimensionValues", () => {
    it("applies dimension values", () => {
      expect(
        buildWmsParams({
          ...MAP_CTX_LAYER_WMS_FIXTURE,
          timeValue: {
            begin: "2023-01-01",
            end: "2023-01-31",
          },
          elevationValue: -10,
          otherDimensionValues: {
            temperature: {
              begin: 123,
              end: 456,
            },
            myDimension: ["abc", "def"],
          },
        }),
      ).toEqual({
        LAYERS: "commune_actuelle_3857",
        STYLES: "default",
        ELEVATION: "-10",
        TIME: "2023-01-01/2023-01-31",
        DIM_TEMPERATURE: "123/456",
        DIM_MYDIMENSION: "abc,def",
      });
    });
  });

  describe("customParams", () => {
    it("spreads customParams as-is into the result", () => {
      expect(
        buildWmsParams({
          ...MAP_CTX_LAYER_WMS_FIXTURE,
          customParams: { COLORSCALERANGE: "-2,35", LOGSCALE: "false" },
        }),
      ).toMatchObject({ COLORSCALERANGE: "-2,35", LOGSCALE: "false" });
    });

    it("omits nothing when customParams is absent", () => {
      const result = buildWmsParams(MAP_CTX_LAYER_WMS_FIXTURE);
      expect(result).not.toHaveProperty("COLORSCALERANGE");
      expect(result).not.toHaveProperty("LOGSCALE");
    });

    it("customParams can override standard params", () => {
      // Explicit vendor override takes precedence over the derived STYLES value
      expect(
        buildWmsParams({
          ...MAP_CTX_LAYER_WMS_FIXTURE,
          style: "boxfill/rainbow",
          customParams: { STYLES: "contour" },
        }),
      ).toEqual({ LAYERS: "commune_actuelle_3857", STYLES: "contour" });
    });
  });
});

describe("updateWmsLayerParams", () => {
  let olLayer: Layer;
  let olSource: TileWMS;

  const baseModel = {
    type: "wms",
    url: "https://example.com/wms",
    name: "myLayer",
  } as MapContextLayerWms;

  beforeEach(() => {
    olSource = new TileWMS({
      url: "https://example.com/wms",
      params: { LAYERS: "myLayer", TILED: true },
    });
    olLayer = new TileLayer({ source: olSource });
    vi.spyOn(olSource, "updateParams");
  });

  it("applies changed dimension values to the source (setting removed ones to undefined)", () => {
    const prev = {
      ...baseModel,
      timeValue: "2020-01-01T00:00:00.000Z",
      otherDimensionValues: {
        temperature: ["123", "456"],
      },
      customParams: { COLORSCALERANGE: "-2,35" },
    };
    const next = {
      ...baseModel,
      timeValue: "2021-06-15T12:30:00.000Z",
      elevationValue: 500,
      customParams: { Hello: "world" },
    };
    updateWmsLayerParams(next, prev, olLayer);
    expect(olSource.updateParams).toHaveBeenCalledWith({
      LAYERS: "myLayer",
      TIME: "2021-06-15T12:30:00.000Z",
      ELEVATION: "500",
      Hello: "world",
      DIM_TEMPERATURE: undefined,
      COLORSCALERANGE: undefined,
    });
  });
});
