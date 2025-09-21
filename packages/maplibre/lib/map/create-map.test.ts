import {
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures";
import { MapContextLayer } from "@geospatial-sdk/core";
import { StyleSpecification } from "maplibre-gl";
import { createLayer } from "./create-map";
import {
  FillLayerSpecification,
  RasterLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import { FEATURE_COLLECTION_POLYGON_FIXTURE_4326 } from "@geospatial-sdk/core/fixtures/geojson.fixtures";

describe("MapContextService", () => {
  describe("#createLayer", () => {
    let layerModel: MapContextLayer, style: StyleSpecification;

    describe("WMS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WMS_FIXTURE),
          (style = await createLayer(layerModel));
      });
      it("create a tile layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        expect(sourcesIds[0]).toBe("source-commune_actuelle_3857");
      });
      it("create a layer", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(1);

        const layer = style.layers[0] as RasterLayerSpecification;
        expect(layer.id).toBe("layer-commune_actuelle_3857");
        expect(layer.source).toBe("source-commune_actuelle_3857");
        expect(layer.type).toBe(`raster`);
      });
    });
    describe("GEOJSON", () => {
      describe("with inline data", () => {
        beforeEach(async () => {
          layerModel = MAP_CTX_LAYER_GEOJSON_FIXTURE;
          style = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("create a source", () => {
          const sourcesIds = Object.keys(style.sources);
          expect(sourcesIds.length).toBe(1);
        });
        it("create a layer", () => {
          expect(style.layers).toBeTruthy();
          expect(style.layers.length).toBe(1);
        });

        it("set correct source properties", () => {
          const sourcesIds = Object.keys(style.sources);
          const source = style.sources[sourcesIds[0]];
          expect(source.type).toBe("geojson");
          expect(source.data).toBe(layerModel.data);
        });
        it("set correct layer properties", () => {
          const layer = style.layers[0] as FillLayerSpecification;
          expect(layer.type).toBe(`fill`);
          expect(layer.paint["fill-color"]).toBe("#68C6DE");
          expect(layer.paint["fill-opacity"]).toBe(0.6);
        });
      });
      describe("with inline data as string", () => {
        beforeEach(async () => {
          layerModel = { ...MAP_CTX_LAYER_GEOJSON_FIXTURE };
          layerModel.data = JSON.stringify(layerModel.data);
          style = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("create a source", () => {
          const sourcesIds = Object.keys(style.sources);
          expect(sourcesIds.length).toBe(1);
        });
        it("create a layer", () => {
          expect(style.layers).toBeTruthy();
          expect(style.layers.length).toBe(1);
        });

        it("set correct source properties", () => {
          const sourcesIds = Object.keys(style.sources);
          const source = style.sources[sourcesIds[0]];
          expect(source.type).toBe("geojson");
          expect(source.data).toEqual(MAP_CTX_LAYER_GEOJSON_FIXTURE.data);
        });

        it("set correct layer properties", () => {
          const layer = style.layers[0] as FillLayerSpecification;
          expect(layer.type).toBe(`fill`);
          expect(layer.paint["fill-color"]).toBe("#68C6DE");
          expect(layer.paint["fill-opacity"]).toBe(0.6);
        });
      });
      describe("with invalid inline data as string", () => {
        beforeEach(async () => {
          const spy = vi.spyOn(window.console, "warn");
          spy.mockClear();
          layerModel = {
            ...MAP_CTX_LAYER_GEOJSON_FIXTURE,
            url: undefined,
            data: "blargz",
          };
          style = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("outputs error in the console", () => {
          expect(window.console.warn).toHaveBeenCalled();
        });
        it("create an empty VectorSource source", () => {
          expect(style).toEqual({
            layers: [],
            sources: {
              "source-undefined": {
                data: {
                  features: [],
                  type: "FeatureCollection",
                },
                type: "geojson",
              },
            },
          });
        });
        describe("with remote file url", () => {
          beforeEach(async () => {
            layerModel = MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE;
            global.fetch = vi.fn(() =>
              Promise.resolve({
                ok: true,
                json: () =>
                  Promise.resolve(FEATURE_COLLECTION_POLYGON_FIXTURE_4326),
              }),
            );
            style = await createLayer(layerModel);
          });
          it("create a VectorLayer", () => {
            expect(style).toBeTruthy();
          });
          it("create a source", () => {
            const sourcesIds = Object.keys(style.sources);
            expect(sourcesIds.length).toBe(1);
          });
          it("create a layer", () => {
            expect(style.layers).toBeTruthy();
            expect(style.layers.length).toBe(1);
          });

          it("set correct source properties", () => {
            const sourcesIds = Object.keys(style.sources);
            const source = style.sources[sourcesIds[0]];
            expect(source.type).toBe("geojson");
            expect(source.data).toEqual(MAP_CTX_LAYER_GEOJSON_FIXTURE.data);
          });

          it("set correct layer properties", () => {
            const layer = style.layers[0] as FillLayerSpecification;
            expect(layer.type).toBe(`fill`);
            expect(layer.paint["fill-color"]).toBe("#68C6DE");
            expect(layer.paint["fill-opacity"]).toBe(0.6);
          });
        });
      });
    });
  });
});
