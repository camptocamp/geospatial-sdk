import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE,
  MAP_CTX_LAYER_OGCAPI_FIXTURE,
  MAP_CTX_LAYER_WFS_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
  MAP_CTX_LAYER_WMTS_FIXTURE,
  MAP_CTX_LAYER_XYZ_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import { LayerGeojsonWithData, MapContextLayer } from "@geospatial-sdk/core";
import { createLayer } from "./create-map.js";
import {
  FillLayerSpecification,
  GeoJSONSourceSpecification,
  RasterLayerSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import { FEATURE_COLLECTION_POLYGON_FIXTURE_4326 } from "@geospatial-sdk/core/fixtures/geojson.fixtures.js";
import {
  LayerMetadataSpecification,
  PartialStyleSpecification,
} from "../maplibre.models.js";
import { RasterSourceSpecification } from "maplibre-gl";

describe("MapContextService", () => {
  describe("#createLayer", () => {
    let layerModel: MapContextLayer, style: PartialStyleSpecification;

    beforeEach(() => {
      // This makes it so that every layerId/sourceId will be "123456"
      vi.spyOn(Math, "random").mockReturnValue(0.123456);
    });

    describe("WMS", () => {
      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_WMS_FIXTURE;
        style = (await createLayer(layerModel)) as PartialStyleSpecification;
      });
      it("create a tile layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id] as RasterSourceSpecification;
        expect(id).toBe("123456");
        expect(source.tiles).toEqual([
          "https://www.datagrandest.fr/geoserver/region-grand-est/ows?REQUEST=GetMap&SERVICE=WMS&layers=commune_actuelle_3857&styles=&format=image%2Fpng&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG%3A3857&BBOX={bbox-epsg-3857}",
        ]);
      });
      it("create a layer", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(1);

        const layer = style.layers[0] as RasterLayerSpecification;
        const metadata = layer.metadata as LayerMetadataSpecification;

        expect(layer.id).toBe("123456");
        expect(layer.type).toBe("raster");
        expect(layer.source).toBe(layer.id);
        expect(metadata.layerId).toBeUndefined();
        expect(metadata.layerHash).toBeTypeOf("string");
        expect(layer.paint?.["raster-opacity"]).toBe(0.5);
        expect(layer.layout?.visibility).toBe("none");
      });

      describe("with an id", () => {
        beforeEach(async () => {
          layerModel = { ...MAP_CTX_LAYER_WMS_FIXTURE, id: "my-test-layer" };
          style = (await createLayer(layerModel)) as PartialStyleSpecification;
        });
        it("create a layer with layer id in metadata", () => {
          const layer = style.layers[0] as RasterLayerSpecification;
          const metadata = layer.metadata as LayerMetadataSpecification;
          expect(metadata.layerHash).toBeUndefined();
          expect(metadata.layerId).toBe("my-test-layer");
        });
      });
    });

    describe("GEOJSON", () => {
      describe("with inline data", () => {
        beforeEach(async () => {
          layerModel = MAP_CTX_LAYER_GEOJSON_FIXTURE;
          style = (await createLayer(layerModel)) as PartialStyleSpecification;
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("create a source", () => {
          const sourcesIds = Object.keys(style.sources);
          expect(sourcesIds.length).toBe(1);
          expect(sourcesIds[0]).toBe("123456");
        });
        it("create 5 layers", () => {
          expect(style.layers).toBeTruthy();
          expect(style.layers.length).toBe(5);

          const sourceId = "123456";
          expect(style.layers[0].id).toBe(`${sourceId}-0`);
          expect((style.layers[0] as FillLayerSpecification).source).toBe(
            sourceId,
          );
          expect(style.layers[0].type).toBe("line");
          expect(style.layers[1].id).toBe(`${sourceId}-1`);
          expect((style.layers[1] as FillLayerSpecification).source).toBe(
            sourceId,
          );
          expect(style.layers[1].type).toBe("line");
          expect(style.layers[2].id).toBe(`${sourceId}-2`);
          expect((style.layers[2] as FillLayerSpecification).source).toBe(
            sourceId,
          );
          expect(style.layers[2].type).toBe("fill");
          expect(style.layers[3].id).toBe(`${sourceId}-3`);
          expect((style.layers[3] as FillLayerSpecification).source).toBe(
            sourceId,
          );
          expect(style.layers[3].type).toBe("line");
          expect(style.layers[4].id).toBe(`${sourceId}-4`);
          expect((style.layers[4] as FillLayerSpecification).source).toBe(
            sourceId,
          );
          expect(style.layers[4].type).toBe("circle");
        });

        it("set correct source properties", () => {
          const sourcesIds = Object.keys(style.sources);
          const source = style.sources[
            sourcesIds[0]
          ] as GeoJSONSourceSpecification;
          expect(source.type).toBe("geojson");
          expect(source.data).toBe((layerModel as LayerGeojsonWithData).data);
        });
      });
      describe("with inline data as string", () => {
        beforeEach(async () => {
          layerModel = { ...MAP_CTX_LAYER_GEOJSON_FIXTURE };
          layerModel.data = JSON.stringify(layerModel.data);
          style = (await createLayer(layerModel)) as PartialStyleSpecification;
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("create a source", () => {
          const sourcesIds = Object.keys(style.sources);
          expect(sourcesIds.length).toBe(1);
        });
        it("create 5 layers", () => {
          expect(style.layers).toBeTruthy();
          expect(style.layers.length).toBe(5);
        });

        it("set correct source properties", () => {
          const sourcesIds = Object.keys(style.sources);
          const source = style.sources[
            sourcesIds[0]
          ] as GeoJSONSourceSpecification;
          expect(source.type).toBe("geojson");
          expect(source.data).toEqual(MAP_CTX_LAYER_GEOJSON_FIXTURE.data);
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
          style = (await createLayer(layerModel)) as PartialStyleSpecification;
        });
        it("create a VectorLayer", () => {
          expect(style).toBeTruthy();
        });
        it("outputs error in the console", () => {
          expect(window.console.warn).toHaveBeenCalled();
        });
        it("create an empty VectorSource source", () => {
          expect(style.sources).toEqual({
            "123456": {
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
            globalThis.fetch = vi.fn(() =>
              Promise.resolve({
                ok: true,
                json: () =>
                  Promise.resolve(FEATURE_COLLECTION_POLYGON_FIXTURE_4326),
              } as Response),
            );
            style = (await createLayer(layerModel))!;
          });
          it("create a VectorLayer", () => {
            expect(style).toBeTruthy();
          });
          it("create a source", () => {
            const sourcesIds = Object.keys(style.sources);
            expect(sourcesIds.length).toBe(1);
            expect(sourcesIds[0]).toBe("123456");
          });
          it("create 5 layers", () => {
            expect(style.layers).toBeTruthy();
            expect(style.layers.length).toBe(5);
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
        });
      });
    });

    describe("WFS", () => {
      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_WFS_FIXTURE;
        style = (await createLayer(layerModel)) as PartialStyleSpecification;
      });
      it("create a vector layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id] as GeoJSONSourceSpecification;
        expect(id).toBe("123456");
        expect(source.data).toEqual(
          "https://www.datagrandest.fr/geoserver/region-grand-est/ows?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application%2Fjson&typename=ms%3Acommune_actuelle_3857&srsname=EPSG%3A3857&bbox=10%2C20%2C30%2C40%2CEPSG%3A3857&maxFeatures=10000",
        );
      });
      it("create 5 layers", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(5);

        const sourceId = "123456";
        expect(style.layers[0].id).toBe(`${sourceId}-0`);
        expect((style.layers[0] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[0].type).toBe("line");
        expect(style.layers[1].id).toBe(`${sourceId}-1`);
        expect((style.layers[1] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[1].type).toBe("line");
        expect(style.layers[2].id).toBe(`${sourceId}-2`);
        expect((style.layers[2] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[2].type).toBe("fill");
        expect(style.layers[3].id).toBe(`${sourceId}-3`);
        expect((style.layers[3] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[3].type).toBe("line");
        expect(style.layers[4].id).toBe(`${sourceId}-4`);
        expect((style.layers[4] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[4].type).toBe("circle");
      });
    });

    describe("OGCAPI", () => {
      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_OGCAPI_FIXTURE;
        style = (await createLayer(layerModel)) as PartialStyleSpecification;
      });
      it("create a vector layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        const id = sourcesIds[0];
        const source = style.sources[id] as GeoJSONSourceSpecification;
        expect(id).toBe("123456");
        expect(source.data).toEqual(
          "https://demo.ldproxy.net/zoomstack/collections/airports/items?f=json",
        );
      });
      it("create 5 layers", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(5);

        const sourceId = "123456";
        expect(style.layers[0].id).toBe(`${sourceId}-0`);
        expect((style.layers[0] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[0].type).toBe("line");
        expect(style.layers[1].id).toBe(`${sourceId}-1`);
        expect((style.layers[1] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[1].type).toBe("line");
        expect(style.layers[2].id).toBe(`${sourceId}-2`);
        expect((style.layers[2] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[2].type).toBe("fill");
        expect(style.layers[3].id).toBe(`${sourceId}-3`);
        expect((style.layers[3] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[3].type).toBe("line");
        expect(style.layers[4].id).toBe(`${sourceId}-4`);
        expect((style.layers[4] as FillLayerSpecification).source).toBe(
          sourceId,
        );
        expect(style.layers[4].type).toBe("circle");
      });
    });

    describe("XYZ", () => {
      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_XYZ_FIXTURE;
        style = (await createLayer(layerModel)) as PartialStyleSpecification;
      });
      it("create a layer and source", () => {
        const sourceId = "123456";

        expect(style).toEqual({
          layers: [
            {
              id: sourceId,
              layout: {
                visibility: "visible",
              },
              metadata: {
                layerHash: "3863171382",
              },
              paint: {
                "raster-opacity": 1,
              },
              source: sourceId,
              type: "raster",
            },
          ],
          sources: {
            [sourceId]: {
              tileSize: 256,
              tiles: ["https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"],
              type: "raster",
            },
          },
        });
      });
    });

    describe("WMTS", () => {
      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_WMTS_FIXTURE;
      });
      it("does not support this layer type", async () => {
        expect(await createLayer(layerModel)).toBe(null);
      });
    });
  });
});
