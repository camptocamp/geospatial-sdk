import { FeatureCollection } from "geojson";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import Map from "ol/Map";
import TileWMS from "ol/source/TileWMS";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import View from "ol/View";
import GeoJSON from "ol/format/GeoJSON";
import {
  MAP_CTX_EXTENT_FIXTURE,
  MAP_CTX_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_FIXTURE,
  MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE,
  MAP_CTX_LAYER_MAPBLIBRE_STYLE_FIXTURE,
  MAP_CTX_LAYER_MVT_FIXTURE,
  MAP_CTX_LAYER_OGCAPI_FIXTURE,
  MAP_CTX_LAYER_WFS_FIXTURE,
  MAP_CTX_LAYER_WMS_FIXTURE,
  MAP_CTX_LAYER_WMTS_FIXTURE,
  MAP_CTX_LAYER_XYZ_FIXTURE,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures";
import {
  MapContext,
  MapContextLayer,
  MapContextLayerGeojson,
  MapContextLayerWms,
  SourceLoadErrorEvent,
} from "@geospatial-sdk/core";
import Layer from "ol/layer/Layer";
import {
  createLayer,
  createMapFromContext,
  createView,
  resetMapFromContext,
} from "./create-map";
import WMTS from "ol/source/WMTS";
import { VectorTile } from "ol/source";
import { MapboxVectorLayer } from "ol-mapbox-style";
import {
  handleEndpointError,
  tileLoadErrorCatchFunction,
} from "./handle-errors";
import { ImageTile } from "ol";
import TileState from "ol/TileState.js";
import VectorTileLayer from "ol/layer/VectorTile";

vi.mock("./handle-errors", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    tileLoadErrorCatchFunction: vi.fn(),
    handleEndpointError: vi.fn(),
  };
});

describe("MapContextService", () => {
  describe("#createLayer", () => {
    let layerModel: MapContextLayer, layer: Layer;

    describe("XYZ", () => {
      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_XYZ_FIXTURE;
        layer = await createLayer(layerModel);
      });
      it("create a tile layer", () => {
        expect(layer).toBeTruthy();
        expect(layer).toBeInstanceOf(TileLayer);
      });
      it("set correct layer properties", () => {
        expect(layer.getVisible()).toBe(true);
        expect(layer.getOpacity()).toBe(1);
        expect(layer.get("label")).toBeUndefined();
        expect(layer.getSource()?.getAttributions()).toBeNull();
      });
      it("create a XYZ source", () => {
        const source = layer.getSource();
        expect(source).toBeInstanceOf(XYZ);
      });
      it("set correct urls", () => {
        const source = layer.getSource() as XYZ;
        const urls = source.getUrls() ?? [];
        expect(urls.length).toBe(3);
        expect(urls[0]).toEqual(
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        );
      });
      it("should set tileLoadErrorCatchFunction to handle errors", () => {
        const source = layer.getSource() as XYZ;
        const tileLoadFunction = source.getTileLoadFunction();
        expect(tileLoadFunction).toBeInstanceOf(Function);
        const tile = new ImageTile(
          [0, 0, 0],
          TileState.IDLE,
          "",
          null,
          () => {},
        );
        tileLoadFunction(tile, "http://example.com/tile");
        expect(tileLoadErrorCatchFunction).toHaveBeenCalled();
      });
    });
    describe("OGCAPI", () => {
      beforeEach(async () => {
        layerModel = MAP_CTX_LAYER_OGCAPI_FIXTURE;
        layer = await createLayer(layerModel);
      });
      it("create a vector tile layer", () => {
        expect(layer).toBeTruthy();
        expect(layer).toBeInstanceOf(VectorLayer);
      });
      it("set correct layer properties", () => {
        expect(layer.getVisible()).toBe(true);
        expect(layer.getOpacity()).toBe(1);
        expect(layer.get("label")).toBeUndefined();
        expect(layer.getSource()?.getAttributions()).toBeNull();
      });
      it("create a OGCVectorTile source", () => {
        const source = layer.getSource();
        expect(source).toBeInstanceOf(VectorSource);
      });
      it("set correct url", () => {
        const source = layer.getSource() as VectorSource;
        const url = source.getUrl();
        expect(url).toBe(
          "https://demo.ldproxy.net/zoomstack/collections/airports/items?f=json",
        );
      });
    });
    describe("WMS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WMS_FIXTURE),
          (layer = await createLayer(layerModel));
      });
      it("create a tile layer", () => {
        expect(layer).toBeTruthy();
        expect(layer).toBeInstanceOf(TileLayer);
      });
      it("set correct layer properties", () => {
        expect(layer.getVisible()).toBe(false);
        expect(layer.getOpacity()).toBe(0.5);
        expect(layer.get("label")).toBe("Communes");
        // @ts-ignore
        expect(layer.getSource()?.getAttributions()!()).toEqual(["camptocamp"]);
      });
      it("create a TileWMS source", () => {
        const source = layer.getSource();
        expect(source).toBeInstanceOf(TileWMS);
      });
      it("set correct WMS params", () => {
        const source = layer.getSource() as TileWMS;
        const params = source.getParams();
        expect(params.LAYERS).toBe((layerModel as MapContextLayerWms).name);
        expect(params.STYLES).toBe((layerModel as MapContextLayerWms).style);
      });
      it("set correct url without existing REQUEST and SERVICE params", () => {
        const source = layer.getSource() as TileWMS;
        const urls = source.getUrls() || [];
        expect(urls.length).toBe(1);
        expect(urls[0]).toBe(
          "https://www.geograndest.fr/geoserver/region-grand-est/ows",
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
        const tile = new ImageTile(
          [0, 0, 0],
          TileState.IDLE,
          "",
          null,
          () => {},
        );
        tileLoadFunction(tile, "http://example.com/tile");
        expect(tileLoadErrorCatchFunction).toHaveBeenCalled();
      });
    });

    describe("WFS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WFS_FIXTURE),
          (layer = await createLayer(layerModel));
      });
      it("create a vector layer", () => {
        expect(layer).toBeTruthy();
        expect(layer).toBeInstanceOf(VectorLayer);
      });
      it("set correct layer properties", () => {
        expect(layer.getVisible()).toBe(true);
        expect(layer.getOpacity()).toBe(0.5);
        expect(layer.get("label")).toBe("Communes");
        const source = layer.getSource();
        expect(source).toBeInstanceOf(VectorSource);

        const attributions = layer.getSource()?.getAttributions();
        expect(attributions).not.toBeNull();
        // @ts-ignore
        expect(attributions!()).toEqual(["camptocamp"]);
      });
      it("create a Vector source", () => {
        const source = layer.getSource();
        expect(source).toBeInstanceOf(VectorSource);
      });
      it("set correct url load function", () => {
        const source = layer.getSource() as VectorSource;
        const urlLoader = source.getUrl() as Function;
        expect(urlLoader([10, 20, 30, 40])).toBe(
          "https://www.geograndest.fr/geoserver/region-grand-est/ows?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application%2Fjson&typename=ms%3Acommune_actuelle_3857&srsname=EPSG%3A3857&bbox=10%2C20%2C30%2C40%2CEPSG%3A3857&maxFeatures=10000",
        );
      });
      it("should NOT call handleEndpointError", () => {
        expect(handleEndpointError).not.toHaveBeenCalled();
      });
    });
    describe("WFS error", () => {
      beforeEach(async () => {
        layerModel = { ...MAP_CTX_LAYER_WFS_FIXTURE, url: "https://wfs/error" };
        layer = await createLayer(layerModel);
      });
      it("should call handleEndpointError", () => {
        expect(handleEndpointError).toHaveBeenCalled();
      });
    });

    describe("GEOJSON", () => {
      describe("with inline data", () => {
        beforeEach(async () => {
          layerModel = MAP_CTX_LAYER_GEOJSON_FIXTURE;
          layer = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(layer).toBeTruthy();
          expect(layer).toBeInstanceOf(VectorLayer);
        });
        it("set correct layer properties", () => {
          expect(layer.getVisible()).toBe(true);
          expect(layer.getOpacity()).toBe(0.8);
          expect(layer.get("label")).toBe("Regions");
        });
        it("create a VectorSource source", () => {
          const source = layer.getSource();
          expect(source).toBeInstanceOf(VectorSource);
        });
        it("add features", () => {
          const source = layer.getSource() as VectorSource;
          const features = source.getFeatures();
          const data = (layerModel as MapContextLayerGeojson)
            .data as FeatureCollection;
          expect(features.length).toBe(data.features.length);
        });
      });
      describe("with inline data as string", () => {
        beforeEach(async () => {
          layerModel = { ...MAP_CTX_LAYER_GEOJSON_FIXTURE };
          layerModel.data = JSON.stringify(layerModel.data);
          layer = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(layer).toBeTruthy();
          expect(layer).toBeInstanceOf(VectorLayer);
        });
        it("create a VectorSource source", () => {
          const source = layer.getSource();
          expect(source).toBeInstanceOf(VectorSource);
        });
        it("add features", () => {
          const source = layer.getSource() as VectorSource;
          const features = source.getFeatures();
          expect(features.length).toBe(
            (MAP_CTX_LAYER_GEOJSON_FIXTURE.data as FeatureCollection).features
              .length,
          );
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
          layer = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(layer).toBeTruthy();
          expect(layer).toBeInstanceOf(VectorLayer);
        });
        it("outputs error in the console", () => {
          expect(window.console.warn).toHaveBeenCalled();
        });
        it("create an empty VectorSource source", () => {
          const source = layer.getSource() as VectorSource;
          expect(source).toBeInstanceOf(VectorSource);
          expect(source.getFeatures().length).toBe(0);
        });
      });
      describe("with remote file url", () => {
        beforeEach(async () => {
          layerModel = MAP_CTX_LAYER_GEOJSON_REMOTE_FIXTURE;
          layer = await createLayer(layerModel);
        });
        it("create a VectorLayer", () => {
          expect(layer).toBeTruthy();
          expect(layer).toBeInstanceOf(VectorLayer);
        });
        it("create a VectorSource source", () => {
          const source = layer.getSource();
          expect(source).toBeInstanceOf(VectorSource);
        });
        it("sets the format as GeoJSON", () => {
          const source = layer.getSource() as VectorSource;
          expect(source.getFormat()).toBeInstanceOf(GeoJSON);
        });
        it("set the url to point to the file", () => {
          const source = layer.getSource() as VectorSource;
          expect(source.getUrl()).toBe(
            (layerModel as MapContextLayerGeojson).url,
          );
        });
      });
    });

    describe("WMTS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WMTS_FIXTURE),
          (layer = await createLayer(layerModel));
      });
      afterEach(() => {
        vi.clearAllMocks();
      });
      it("create a tile layer", () => {
        expect(layer).toBeTruthy();
        expect(layer).toBeInstanceOf(TileLayer);
      });
      it("set correct layer properties", () => {
        expect(layer.getVisible()).toBe(true);
        expect(layer.getOpacity()).toBe(1);
        expect(layer.get("label")).toBeUndefined();
        expect(layer.getSource()?.getAttributions()).toBeNull();
      });
      it("create a WMTS source", () => {
        const source = layer.getSource();
        expect(source).toBeInstanceOf(WMTS);
      });
      it("set correct urls", () => {
        const source = layer.getSource() as WMTS;
        const urls = source.getUrls() ?? [];
        expect(urls).toEqual([
          "https://services.geo.sg.ch/wss/service/SG00066_WMTS/guest/tile/1.0.0/SG00066/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}",
        ]);
      });
      it("should NOT call handleEndpointError", () => {
        expect(handleEndpointError).not.toHaveBeenCalled();
      });
    });
    describe("WMTS error", () => {
      beforeEach(async () => {
        layerModel = {
          ...MAP_CTX_LAYER_WMTS_FIXTURE,
          url: "https://wmts/error",
        };
        layer = await createLayer(layerModel);
      });
      it("should call handleEndpointError", () => {
        expect(handleEndpointError).toHaveBeenCalled();
      });
      afterEach(() => {
        vi.clearAllMocks();
      });
    });

    describe("Maplibre Style", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_MAPBLIBRE_STYLE_FIXTURE),
          (layer = await createLayer(layerModel));
      });
      it("create a tile layer", () => {
        expect(layer).toBeTruthy();
        expect(layer).toBeInstanceOf(MapboxVectorLayer);
      });
      it("set correct layer properties", () => {
        expect(layer.getVisible()).toBe(true);
        expect(layer.getOpacity()).toBe(1);
        expect(layer.get("label")).toBeUndefined();
      });
      it("create a Vector Tile source", () => {
        const source = layer.getSource();
        expect(source).toBeInstanceOf(VectorTile);
      });
    });

    describe("MVT", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_MVT_FIXTURE),
          (layer = await createLayer(layerModel));
      });
      it("create a VectorTileLayer", () => {
        expect(layer).toBeTruthy();
        expect(layer).toBeInstanceOf(VectorTileLayer);
      });
      it("create a VectorTile source", () => {
        const source = layer.getSource();
        expect(source).toBeInstanceOf(VectorTile);
      });
      it("set correct layer properties", () => {
        expect(layer.getVisible()).toBe(true);
        expect(layer.getOpacity()).toBe(1);
        expect(layer.get("label")).toBeUndefined();
      });
    });
  });

  describe("#createView", () => {
    let view: View;
    let map: Map;
    describe("from center and zoom", () => {
      const contextModel = MAP_CTX_FIXTURE;
      beforeEach(async () => {
        map = await createMapFromContext(contextModel);
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
  describe("#resetMapFromContext", () => {
    const map = new Map({});
    const mapContext = MAP_CTX_FIXTURE;
    beforeEach(() => {
      resetMapFromContext(map, mapContext);
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
      const map = new Map({});
      const mapContext: MapContext = {
        view: null,
        layers: [
          MAP_CTX_LAYER_XYZ_FIXTURE,
          MAP_CTX_LAYER_WMS_FIXTURE,
          MAP_CTX_LAYER_GEOJSON_FIXTURE,
        ],
      };
      beforeEach(() => {
        resetMapFromContext(map, mapContext);
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
});
