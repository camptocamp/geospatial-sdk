import { createViewFromLayer } from "./view.js";
import {
  MapContextLayerGeojson,
  MapContextLayerWfs,
  MapContextLayerWms,
  MapContextLayerWmts,
  ViewByExtent,
} from "../model/index.js";

vitest.mock("@camptocamp/ogc-client", () => ({
  WmsEndpoint: class {
    constructor() {}
    isReady() {
      return Promise.resolve({
        getLayerByName: (name: string) => {
          if (name.includes("error")) {
            throw new Error("Something went wrong");
          }
          let boundingBoxes = {};
          if (name.includes("4326a")) {
            boundingBoxes = {
              ...boundingBoxes,
              "EPSG:4326": [1, 2.6, 3.3, 4.2],
              "CRS:84": [2.3, 50.6, 2.8, 50.9],
            };
          }
          if (name.includes("4326b")) {
            boundingBoxes = {
              ...boundingBoxes,
              "EPSG:4326": [2.3, 50.6, 2.8, 50.9],
            };
          }
          if (name.includes("2154a")) {
            boundingBoxes = {
              ...boundingBoxes,
              "EPSG:2154": [650796.4, 7060330.6, 690891.3, 7090402.2],
            };
          }
          if (name.includes("2154b")) {
            boundingBoxes = {
              ...boundingBoxes,
              "EPSG:2154": [100_000, 200_000, 400_000, 500_000],
            };
          }
          if (name.includes("32631")) {
            boundingBoxes = {
              ...boundingBoxes,
              "EPSG:32631": [10_000, 20_000, 40_000, 50_000],
            };
          }
          return {
            name,
            boundingBoxes,
          };
        },
      });
    }
  },
  WmtsEndpoint: class {
    constructor() {}
    isReady() {
      return Promise.resolve({
        getSingleLayerName: () => "layerName",
        getLayerByName: () => ({
          latLonBoundingBox: [1, 2.6, 3.3, 4.2],
        }),
      });
    }
  },
  WfsEndpoint: class {
    constructor(private url: string) {}
    isReady() {
      return Promise.resolve({
        getFeatureTypeSummary: (featureType: string) => {
          return {
            name: featureType,
            boundingBox: [1.33, 48.81, 4.3, 51.1],
          };
        },
      });
    }
  },
}));

describe("view", () => {
  describe("createViewFromLayer", () => {
    it("should return view for WMS layer", async () => {
      const layer = {
        type: "wms",
        name: "mock_4326a",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        extent: [1, 2.6, 3.3, 4.2],
      });
    });

    it("should preserve the CRS when only a projected WMS bounding box is available", async () => {
      const layer = {
        type: "wms",
        name: "mock_2154a",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);

      expect(view).toEqual({
        extent: [650796.4, 7060330.6, 690891.3, 7090402.2, "EPSG:2154"],
      });
    });

    it("should combine the extents of comma-separated WMS sublayers", async () => {
      const layer = {
        type: "wms",
        name: "mock_4326a, mock_4326b",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);

      expect(view).toEqual({
        extent: [1, 2.6, 3.3, 50.9],
      });
    });

    it("should combine extents of multiple WMS layers in a common EPSG", async () => {
      const layer = {
        type: "wms",
        name: " mock_4326a_2154a, mock_2154b",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);
      const extent = (view as ViewByExtent).extent;

      expect(extent).toEqual([
        100000,
        200000,
        690891.3,
        7090402.2,
        "EPSG:2154",
      ]);
    });

    it("should ignore WMS layers without bounding boxes", async () => {
      const layer = {
        type: "wms",
        name: "mock_4326a,mock_nobbox ",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);

      expect(view).toEqual({
        extent: [1, 2.6, 3.3, 4.2],
      });
    });

    it("throws if no common CRS found for the given layers", async () => {
      const layer = {
        type: "wms",
        name: "mock_2154a, mock_nobbox,mock_32631 ",
        url: "http://mock/wms",
      } as MapContextLayerWms;

      await expect(createViewFromLayer(layer)).rejects.toThrow(
        "Could not compute the combine extent of the following WMS layers: mock_2154a, mock_nobbox,mock_32631",
      );
    });

    it("should return view for WMTS layer", async () => {
      const layer = {
        type: "wmts",
        name: "mock",
        url: "http://mock/wmts",
      } as MapContextLayerWmts;
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        extent: [1, 2.6, 3.3, 4.2],
      });
    });

    it("should return view for WFS layer", async () => {
      const layer = {
        type: "wfs",
        featureType: "mock",
        url: "http://mock/wfs",
      } as MapContextLayerWfs;
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        extent: [1.33, 48.81, 4.3, 51.1],
      });
    });

    it("should return view for GeoJSON layer", async () => {
      const layer = {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: [125.6, 10.1],
              },
            },
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: [100, 200],
              },
            },
          ],
        },
      } as MapContextLayerGeojson;
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        extent: [100, 10.1, 125.6, 200],
      });
    });

    it("should throw error for unsupported layer type", async () => {
      const layer = { type: "unsupported" } as any;
      await expect(createViewFromLayer(layer)).rejects.toThrow(
        "Unsupported layer type: unsupported",
      );
    });
  });
});
