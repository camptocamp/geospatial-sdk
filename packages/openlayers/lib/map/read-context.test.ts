import { describe, it, expect, beforeEach, vi } from "vitest";
import Map from "ol/Map";
import View from "ol/View";
import {
  MapContext,
  MapContextLayer,
  MapContextLayerXyz,
  MapContextLayerWms,
  MapContextLayerWfs,
  MapContextLayerGeojson,
  MapContextLayerWmts,
} from "@geospatial-sdk/core";
import {
  MAP_CTX_LAYER_XYZ_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE,
  MAP_CTX_LAYER_WFS_FIXTURE,
  MAP_CTX_LAYER_WMTS_FIXTURE,
  MAP_CTX_LAYER_MVT_FIXTURE,
  MAP_CTX_LAYER_OGCAPI_FIXTURE,
  MAP_CTX_VIEW_FIXTURE,
  MAP_CTX_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures";
import { createLayer, createMapFromContext, createView } from "./create-map";
import { readContextFromMap } from "./read-context";

// Mock the WFS endpoint to make it resolve immediately
vi.mock("@camptocamp/ogc-client", async () => {
  const actual = await vi.importActual("@camptocamp/ogc-client");
  return {
    ...actual,
    WfsEndpoint: class MockWfsEndpoint {
      constructor(public url: string) {}
      async isReady() {
        // Return resolved promise to make the endpoint immediately ready
        return Promise.resolve(this);
      }
      getSingleFeatureTypeName() {
        return null;
      }
      getFeatureUrl(typeName: string, options: any) {
        return `${this.url}?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application%2Fjson&typename=${typeName}&srsname=${options.outputCrs}&bbox=${options.extent.join("%2C")}&maxFeatures=${options.maxFeatures}`;
      }
    },
  };
});

describe("readContextFromMap", () => {
  describe("#extractLayerModel", () => {
    describe("XYZ", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_XYZ_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel.type).toBe("xyz");
      });

      it("extracts the correct url", () => {
        // OpenLayers expands the URL template, so we check for the first URL
        const url = (extractedLayerModel as MapContextLayerXyz).url;
        expect(url).toContain("tile.openstreetmap.org");
        expect(url).toContain("/{z}/{x}/{y}.png");
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel.visibility).toBe(true);
        expect(extractedLayerModel.opacity).toBe(1);
      });
    });

    describe("XYZ with custom properties", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = {
          ...MAP_CTX_LAYER_XYZ_FIXTURE,
          visibility: false,
          opacity: 0.7,
          label: "Test Layer",
          attributions: "Test Attribution",
        };
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts custom visibility", () => {
        expect(extractedLayerModel.visibility).toBe(false);
      });

      it("extracts custom opacity", () => {
        expect(extractedLayerModel.opacity).toBe(0.7);
      });

      it("extracts custom label", () => {
        expect(extractedLayerModel.label).toBe("Test Layer");
      });

      it("extracts custom attributions", () => {
        expect(extractedLayerModel.attributions).toBe("Test Attribution");
      });
    });

    describe("WMS", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_WMS_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel.type).toBe("wms");
      });

      it("extracts the correct url", () => {
        expect((extractedLayerModel as MapContextLayerWms).url).toBe(
          "https://www.geograndest.fr/geoserver/region-grand-est/ows",
        );
      });

      it("extracts the correct layer name", () => {
        // The name is stored without the 'ms:' prefix after processing
        expect((extractedLayerModel as MapContextLayerWms).name).toBe(
          "commune_actuelle_3857",
        );
      });

      it("extracts the style", () => {
        expect((extractedLayerModel as MapContextLayerWms).style).toBe(
          "default",
        );
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel.visibility).toBe(false);
        expect(extractedLayerModel.opacity).toBe(0.5);
        expect(extractedLayerModel.label).toBe("Communes");
      });

      it("extracts attributions", () => {
        expect(extractedLayerModel.attributions).toBe("camptocamp");
      });
    });

    describe("WFS", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_WFS_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        // Wait for the promise chain to complete (mock resolves immediately but .then is async)
        await vi.waitFor(
          () => {
            const source = layer.getSource();
            if (!source) {
              throw new Error("Source not ready yet");
            }
          },
          { timeout: 1000, interval: 10 },
        );
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel?.type).toBe("wfs");
      });

      it("extracts the base url", () => {
        expect((extractedLayerModel as MapContextLayerWfs)?.url).toBe(
          "https://www.geograndest.fr/geoserver/region-grand-est/ows",
        );
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel?.visibility).toBe(true);
        expect(extractedLayerModel?.opacity).toBe(0.5);
        expect(extractedLayerModel?.label).toBe("Communes");
      });

      it("extracts attributions", () => {
        expect(extractedLayerModel?.attributions).toBe("camptocamp");
      });
    });

    describe("GEOJSON with inline data", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_GEOJSON_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel.type).toBe("geojson");
      });

      it("extracts the feature data", () => {
        const geojsonModel = extractedLayerModel as MapContextLayerGeojson;
        expect(geojsonModel.data).toBeDefined();
        const data = geojsonModel.data as any;
        expect(data.type).toBe("FeatureCollection");
        expect(data.features).toBeDefined();
        expect(data.features.length).toBeGreaterThan(0);
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel.visibility).toBe(true);
        expect(extractedLayerModel.opacity).toBe(0.8);
        expect(extractedLayerModel.label).toBe("Regions");
      });
    });

    describe("GEOJSON with remote url", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel.type).toBe("geojson");
      });

      it("extracts the url", () => {
        // The fixture uses a different URL format
        const url = (extractedLayerModel as MapContextLayerGeojson).url;
        expect(url).toBeDefined();
        expect(typeof url).toBe("string");
      });

      it("does not have inline data", () => {
        expect(
          (extractedLayerModel as MapContextLayerGeojson).data,
        ).toBeUndefined();
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel.visibility).toBe(true);
        expect(extractedLayerModel.opacity).toBe(1);
      });
    });

    describe("WMTS", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_WMTS_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        // Wait for async source to be ready
        await new Promise((resolve) => setTimeout(resolve, 100));
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel?.type).toBe("wmts");
      });

      it("extracts the url", () => {
        const url = (extractedLayerModel as MapContextLayerWmts)?.url;
        expect(url).toBeDefined();
        expect(url).toContain("services.geo.sg.ch");
      });

      it("extracts the layer name", () => {
        expect(
          (extractedLayerModel as MapContextLayerWmts)?.name,
        ).toBeDefined();
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel?.visibility).toBe(true);
        expect(extractedLayerModel?.opacity).toBe(1);
      });
    });

    describe("MVT (Vector Tiles)", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_MVT_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel.type).toBe("xyz");
      });

      it("extracts the tile format", () => {
        expect((extractedLayerModel as MapContextLayerXyz).tileFormat).toBe(
          "application/vnd.mapbox-vector-tile",
        );
      });

      it("extracts the url", () => {
        expect((extractedLayerModel as MapContextLayerXyz).url).toBe(
          "https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf",
        );
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel.visibility).toBe(true);
        expect(extractedLayerModel.opacity).toBe(1);
      });
    });

    describe("OGCAPI", () => {
      let layerModel: MapContextLayer;
      let extractedLayerModel: MapContextLayer;

      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_OGCAPI_FIXTURE;
        const layer = await createLayer(layerModel);
        const map = new Map({});
        map.addLayer(layer);
        const context = readContextFromMap(map);
        extractedLayerModel = context.layers[0];
      });

      it("extracts the correct layer type", () => {
        expect(extractedLayerModel.type).toBe("geojson");
      });

      it("extracts the url", () => {
        expect((extractedLayerModel as MapContextLayerGeojson).url).toBe(
          "https://demo.ldproxy.net/zoomstack/collections/airports/items?f=json",
        );
      });

      it("extracts layer properties", () => {
        expect(extractedLayerModel.visibility).toBe(true);
        expect(extractedLayerModel.opacity).toBe(1);
      });
    });
  });

  describe("#extractViewModel", () => {
    describe("from center and zoom", () => {
      let viewModel: any;
      let extractedView: any;

      beforeEach(async () => {
        viewModel = MAP_CTX_VIEW_FIXTURE;
        const map = new Map({});
        map.setSize([100, 100]);
        const view = createView(viewModel, map);
        map.setView(view);
        const context = readContextFromMap(map);
        extractedView = context.view;
      });

      it("extracts a view", () => {
        expect(extractedView).toBeTruthy();
      });

      it("extracts the center", () => {
        expect(extractedView.center).toBeDefined();
        expect(extractedView.center).toHaveLength(2);
        // Compare with some tolerance due to projection transformations
        const viewFixture = MAP_CTX_VIEW_FIXTURE as any;
        expect(extractedView.center[0]).toBeCloseTo(viewFixture.center[0], 5);
        expect(extractedView.center[1]).toBeCloseTo(viewFixture.center[1], 5);
      });

      it("extracts the zoom", () => {
        const viewFixture = MAP_CTX_VIEW_FIXTURE as any;
        expect(extractedView.zoom).toBe(viewFixture.zoom);
      });
    });

    describe("with null view", () => {
      let extractedView: any;

      beforeEach(() => {
        const map = new Map({});
        const view = createView(null, map);
        map.setView(view);
        const context = readContextFromMap(map);
        extractedView = context.view;
      });

      it("extracts a view with default values", () => {
        expect(extractedView).toBeTruthy();
        expect(extractedView.center).toEqual([0, 0]);
        expect(extractedView.zoom).toBe(0);
      });
    });
  });

  describe("#readContextFromMap", () => {
    describe("full map context", () => {
      let originalContext: MapContext;
      let extractedContext: MapContext;

      beforeEach(async () => {
        originalContext = MAP_CTX_FIXTURE;
        const map = await createMapFromContext(originalContext);
        extractedContext = readContextFromMap(map);
      });

      it("extracts the correct number of layers", () => {
        expect(extractedContext.layers).toHaveLength(
          originalContext.layers.length,
        );
      });

      it("extracts all layer types correctly", () => {
        expect(extractedContext.layers[0].type).toBe(
          originalContext.layers[0].type,
        );
        expect(extractedContext.layers[1].type).toBe(
          originalContext.layers[1].type,
        );
        expect(extractedContext.layers[2].type).toBe(
          originalContext.layers[2].type,
        );
      });

      it("extracts the view", () => {
        expect(extractedContext.view).toBeTruthy();
        expect((extractedContext.view as any)?.center).toBeDefined();
        expect((extractedContext.view as any)?.zoom).toBe(
          (originalContext.view as any)?.zoom,
        );
      });
    });

    describe("map with multiple layers of different types", () => {
      let extractedContext: MapContext;

      beforeEach(async () => {
        const map = new Map({});
        const xyzLayer = await createLayer(MAP_CTX_LAYER_XYZ_FIXTURE);
        const wmsLayer = await createLayer(MAP_CTX_LAYER_WMS_FIXTURE);
        const geojsonLayer = await createLayer(MAP_CTX_LAYER_GEOJSON_FIXTURE);
        map.addLayer(xyzLayer);
        map.addLayer(wmsLayer);
        map.addLayer(geojsonLayer);
        map.setView(createView(MAP_CTX_VIEW_FIXTURE, map));
        extractedContext = readContextFromMap(map);
      });

      it("extracts all layers in correct order", () => {
        expect(extractedContext.layers).toHaveLength(3);
        expect(extractedContext.layers[0].type).toBe("xyz");
        expect(extractedContext.layers[1].type).toBe("wms");
        expect(extractedContext.layers[2].type).toBe("geojson");
      });

      it("extracts the view", () => {
        expect(extractedContext.view).toBeTruthy();
      });
    });

    describe("empty map", () => {
      let extractedContext: MapContext;

      beforeEach(() => {
        const map = new Map({});
        map.setView(new View({ center: [0, 0], zoom: 1 }));
        extractedContext = readContextFromMap(map);
      });

      it("returns empty layers array", () => {
        expect(extractedContext.layers).toEqual([]);
      });

      it("extracts the view", () => {
        expect(extractedContext.view).toBeTruthy();
        expect((extractedContext.view as any)?.center).toEqual([0, 0]);
        expect((extractedContext.view as any)?.zoom).toBe(1);
      });
    });

    describe("roundtrip test", () => {
      it("should produce equivalent context after roundtrip", async () => {
        const originalContext = MAP_CTX_FIXTURE;
        const map = await createMapFromContext(originalContext);
        const extractedContext = readContextFromMap(map);
        const map2 = await createMapFromContext(extractedContext);
        const extractedContext2 = readContextFromMap(map2);

        // Compare layer types
        expect(extractedContext2.layers.map((l) => l.type)).toEqual(
          extractedContext.layers.map((l) => l.type),
        );

        // Compare view zoom
        expect((extractedContext2.view as any)?.zoom).toBe(
          (extractedContext.view as any)?.zoom,
        );

        // Compare view center with tolerance
        expect((extractedContext2.view as any)?.center[0]).toBeCloseTo(
          (extractedContext.view as any)?.center[0] || 0,
          5,
        );
        expect((extractedContext2.view as any)?.center[1]).toBeCloseTo(
          (extractedContext.view as any)?.center[1] || 0,
          5,
        );
      });
    });
  });
});
