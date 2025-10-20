import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE,
  MAP_CTX_LAYER_OGCAPI_FIXTURE,
  MAP_CTX_LAYER_WFS_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures";
import { LayerGeojsonWithData, MapContextLayer } from "@geospatial-sdk/core";
import { createLayer } from "./create-map";
import {
  FillLayerSpecification,
  GeoJSONSourceSpecification,
  RasterLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import {
  FEATURE_COLLECTION_LINESTRING_FIXTURE_4326,
  FEATURE_COLLECTION_POINT_FIXTURE_4326,
  FEATURE_COLLECTION_POLYGON_FIXTURE_4326,
} from "@geospatial-sdk/core/fixtures/geojson.fixtures";
import { PartialStyleSpecification } from "../maplibre.models";
import { GeoJSONSource, RasterSourceSpecification } from "maplibre-gl";

describe("MapContextService", () => {
  describe("#createLayer", () => {
    let layerModel: MapContextLayer, style: PartialStyleSpecification;

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
        const id = sourcesIds[0];
        const source = style.sources[id] as RasterSourceSpecification;
        expect(id).toBe("commune_actuelle_3857");
        expect(source.tiles).toEqual([
          "https://www.datagrandest.fr/geoserver/region-grand-est/ows?REQUEST=GetMap&SERVICE=WMS&layers=commune_actuelle_3857&styles=&format=image%2Fpng&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}",
        ]);
      });
      it("create a layer", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(1);

        const layer = style.layers[0] as RasterLayerSpecification;
        expect(layer.id).toBe("commune_actuelle_3857");
        expect(layer.source).toBe("commune_actuelle_3857");
        expect(layer.type).toBe(`raster`);
      });
    });
    describe("GEOJSON", () => {
      describe("with inline data", () => {
        beforeEach(async () => {
          layerModel = MAP_CTX_LAYER_GEOJSON_FIXTURE;
          style = await createLayer(layerModel);
          Math.random = vi.fn(() => 0.027404);
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("create a source", () => {
          const sourcesIds = Object.keys(style.sources);
          expect(sourcesIds.length).toBe(1);
          expect(sourcesIds[0]).toBe("27404");
        });
        it("create 3 layers", () => {
          expect(style.layers).toBeTruthy();
          expect(style.layers.length).toBe(3);

          let layer = style.layers[0] as RasterLayerSpecification;
          expect(layer.id).toBe("27404-fill");
          expect(layer.source).toBe("27404");

          layer = style.layers[1] as RasterLayerSpecification;
          expect(layer.id).toBe("27404-line");
          expect(layer.source).toBe("27404");

          layer = style.layers[2] as RasterLayerSpecification;
          expect(layer.id).toBe("27404-circle");
          expect(layer.source).toBe("27404");
        });

        it("set correct source properties", () => {
          const sourcesIds = Object.keys(style.sources);
          const source = style.sources[
            sourcesIds[0]
          ] as GeoJSONSourceSpecification;
          expect(source.type).toBe("geojson");
          expect(source.data).toBe((layerModel as LayerGeojsonWithData).data);
        });
        it("set correct layer properties", () => {
          const layer = style.layers[0] as FillLayerSpecification;
          expect(layer.type).toBe(`fill`);
          expect(layer.paint["fill-color"]).toBe("#ffffff");
          expect(layer.paint["fill-opacity"]).toBe(0.4);
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
        it("create 3 layers", () => {
          expect(style.layers).toBeTruthy();
          expect(style.layers.length).toBe(3);
        });

        it("set correct source properties", () => {
          const sourcesIds = Object.keys(style.sources);
          const source = style.sources[
            sourcesIds[0]
          ] as GeoJSONSourceSpecification;
          expect(source.type).toBe("geojson");
          expect(source.data).toEqual(MAP_CTX_LAYER_GEOJSON_FIXTURE.data);
        });

        it("set correct layer properties", () => {
          const layer = style.layers[0] as FillLayerSpecification;
          expect(layer.type).toBe(`fill`);
          expect(layer.paint["fill-color"]).toBe("#ffffff");
          expect(layer.paint["fill-opacity"]).toBe(0.4);
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
          } as LayerGeojsonWithData;
          style = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("outputs error in the console", () => {
          expect(window.console.warn).toHaveBeenCalled();
        });
        it("create an empty VectorSource source", () => {
          expect(style.sources).toEqual({
            "27404": {
              data: {
                features: [],
                type: "FeatureCollection",
              },
              type: "geojson",
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
          it("create 3 layers", () => {
            expect(style.layers).toBeTruthy();
            expect(style.layers.length).toBe(3);
          });

          it("set correct source properties", () => {
            const sourcesIds = Object.keys(style.sources);
            const source = style.sources[
              sourcesIds[0]
            ] as GeoJSONSourceSpecification;
            expect(source.type).toBe("geojson");
            expect(source.data).toEqual(MAP_CTX_LAYER_GEOJSON_FIXTURE.data);
          });

          it("set correct layer properties", () => {
            const layer = style.layers[0] as FillLayerSpecification;
            expect(layer.type).toBe(`fill`);
            expect(layer.paint["fill-color"]).toBe("#ffffff");
            expect(layer.paint["fill-opacity"]).toBe(0.4);
          });
        });
      });
    });
    describe("WFS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WFS_FIXTURE),
          (style = await createLayer(layerModel));
      });
      it("create a vector layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id] as GeoJSONSourceSpecification;
        expect(id).toBe("ms:commune_actuelle_3857");
        expect(source.data).toEqual(FEATURE_COLLECTION_POLYGON_FIXTURE_4326);
      });
      it("create 3 layerS", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(1);
        const layer = style.layers[0] as RasterLayerSpecification;
        expect(layer.id).toBe("ms:commune_actuelle_3857-fill");
        expect(layer.source).toBe("ms:commune_actuelle_3857");
      });

      describe("when data type is Poylgon", () => {
        it("set a line paint", () => {
          const layer = style.layers[0] as RasterLayerSpecification;
          expect(layer.type).toBe(`fill`);
        });
      });
      describe("when data type is Point", () => {
        beforeEach(async () => {
          global.fetch = vi.fn(() =>
            Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve(FEATURE_COLLECTION_POINT_FIXTURE_4326),
            }),
          );
          style = await createLayer(layerModel);
        });
        it("set a point paint", () => {
          const layer = style.layers[0] as RasterLayerSpecification;
          expect(layer.type).toBe(`circle`);
        });
      });
      describe("when data type is LineString", () => {
        beforeEach(async () => {
          global.fetch = vi.fn(() =>
            Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve(FEATURE_COLLECTION_LINESTRING_FIXTURE_4326),
            }),
          );
          style = await createLayer(layerModel);
        });
        it("set a line paint", () => {
          const layer = style.layers[0] as RasterLayerSpecification;
          expect(layer.type).toBe(`line`);
        });
      });
    });
    describe("OGCAPI", () => {
      beforeEach(async () => {
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve(FEATURE_COLLECTION_LINESTRING_FIXTURE_4326),
          }),
        );

        (layerModel = MAP_CTX_LAYER_OGCAPI_FIXTURE),
          (style = await createLayer(layerModel));
      });
      it("create a vector layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id];
        expect(id).toBe("airports");
        expect(source.data).toEqual(FEATURE_COLLECTION_LINESTRING_FIXTURE_4326);
      });
      it("create a layer", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(1);
        const layer = style.layers[0] as RasterLayerSpecification;
        expect(layer.id).toBe("airports-line");
        expect(layer.source).toBe("airports");
      });
    });
  });
});
