import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE,
  MAP_CTX_LAYER_OGCAPI_FIXTURE,
  MAP_CTX_LAYER_WFS_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import { LayerGeojsonWithData, MapContextLayer } from "@geospatial-sdk/core";
import { createLayer } from "./create-map.js";
import {
  FillLayerSpecification,
  GeoJSONSourceSpecification,
  RasterLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import {
  FEATURE_COLLECTION_LINESTRING_FIXTURE_4326,
  FEATURE_COLLECTION_POLYGON_FIXTURE_4326,
} from "@geospatial-sdk/core/fixtures/geojson.fixtures.js";
import { PartialStyleSpecification } from "../maplibre.models.js";
import {
  CircleLayerSpecification,
  LayerSpecification,
  LineLayerSpecification,
  RasterSourceSpecification,
} from "maplibre-gl";

describe("MapContextService", () => {
  describe("#createLayer", () => {
    let layerModel: MapContextLayer, style: PartialStyleSpecification;

    describe("WMS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WMS_FIXTURE),
          (style = await createLayer(layerModel, 0));
      });
      it("create a tile layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id] as RasterSourceSpecification;
        expect(id).toBe("1046815418");
        expect(source.tiles).toEqual([
          "https://www.datagrandest.fr/geoserver/region-grand-est/ows?REQUEST=GetMap&SERVICE=WMS&layers=commune_actuelle_3857&styles=&format=image%2Fpng&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG%3A3857&BBOX={bbox-epsg-3857}",
        ]);
      });
      it("create a layer", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(1);

        const layer = style.layers[0] as RasterLayerSpecification;
        expect(layer.id).toBe("1046815418");
        expect(layer.source).toBe("1046815418");
        expect(layer.type).toBe(`raster`);
      });
    });
    describe("GEOJSON", () => {
      describe("with inline data", () => {
        beforeEach(async () => {
          layerModel = MAP_CTX_LAYER_GEOJSON_FIXTURE;
          style = await createLayer(layerModel, 0);
          Math.random = vi.fn(() => 0.027404);
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("create a source", () => {
          const sourcesIds = Object.keys(style.sources);
          expect(sourcesIds.length).toBe(1);
          expect(sourcesIds[0]).toBe("2792250259");
        });
        it("create 3 layers", () => {
          expect(style.layers).toBeTruthy();
          expect(style.layers.length).toBe(3);

          let layer = style.layers[0] as RasterLayerSpecification;
          expect(layer.id).toBe("2792250259-fill");
          expect(layer.source).toBe("2792250259");

          layer = style.layers[1] as RasterLayerSpecification;
          expect(layer.id).toBe("2792250259-line");
          expect(layer.source).toBe("2792250259");

          layer = style.layers[2] as RasterLayerSpecification;
          expect(layer.id).toBe("2792250259-circle");
          expect(layer.source).toBe("2792250259");
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
          expect(layer.paint["fill-color"]).toBe("rgba(255,255,255,0.4)");
        });
      });
      describe("with inline data as string", () => {
        beforeEach(async () => {
          layerModel = { ...MAP_CTX_LAYER_GEOJSON_FIXTURE };
          layerModel.data = JSON.stringify(layerModel.data);
          style = await createLayer(layerModel, 0);
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
          expect(layer.paint["fill-color"]).toBe("rgba(255,255,255,0.4)");
          expect(layer.paint["fill-opacity"]).toBeUndefined();
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
          style = await createLayer(layerModel, 0);
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("outputs error in the console", () => {
          expect(window.console.warn).toHaveBeenCalled();
        });
        it("create an empty VectorSource source", () => {
          expect(style.sources).toEqual({
            "3631250040": {
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
            style = await createLayer(layerModel, 0);
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
            expect(source.data).toEqual(
              "https://my.host.com/data/regions.json",
            );
          });

          it("set correct layer properties", () => {
            const layer = style.layers[0] as FillLayerSpecification;
            expect(layer.type).toBe(`fill`);
            expect(layer.paint["fill-color"]).toBe("rgba(255,255,255,0.4)");
            expect(layer.paint["fill-opacity"]).toBeUndefined();
          });
        });
      });
    });
    describe("WFS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WFS_FIXTURE),
          (style = await createLayer(layerModel, 1));
      });
      it("create a vector layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id] as GeoJSONSourceSpecification;
        expect(id).toBe("985400327");
        expect(source.data).toEqual(
          "https://www.datagrandest.fr/geoserver/region-grand-est/ows?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application%2Fjson&typename=ms%3Acommune_actuelle_3857&srsname=EPSG%3A3857&bbox=10%2C20%2C30%2C40%2CEPSG%3A3857&maxFeatures=10000",
        );
      });
      it("create 3 layers", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(3);

        let layer: LayerSpecification = style
          .layers[0] as FillLayerSpecification;
        expect(layer.id).toBe("985400327-fill");
        expect(layer.source).toBe("985400327");
        expect(layer.metadata.sourcePosition).toBe(1);

        layer = style.layers[1] as LineLayerSpecification;
        expect(layer.id).toBe("985400327-line");
        expect(layer.source).toBe("985400327");
        expect(layer.metadata.sourcePosition).toBe(1);

        layer = style.layers[2] as CircleLayerSpecification;
        expect(layer.id).toBe("985400327-circle");
        expect(layer.source).toBe("985400327");
        expect(layer.metadata.sourcePosition).toBe(1);
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
          (style = await createLayer(layerModel, 0));
      });
      it("create a vector layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id] as GeoJSONSourceSpecification;
        expect(id).toBe("504003385");
        expect(source.data).toEqual(
          "https://demo.ldproxy.net/zoomstack/collections/airports/items?f=json",
        );
      });
      it("create 3 layers", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(3);
        const layer = style.layers[0] as FillLayerSpecification;
        expect(layer.id).toBe("504003385-fill");
        expect(layer.source).toBe("504003385");
        expect(layer.metadata.sourcePosition).toBe(0);
      });
    });
  });
});
