import proj4 from "proj4";
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
          let boundingBoxes;
          if (name.includes("nobbox")) {
            boundingBoxes = {};
          } else if (name.includes("4326")) {
            boundingBoxes = {
              "EPSG:4326": [1, 2.6, 3.3, 4.2],
              "CRS:84": [2.3, 50.6, 2.8, 50.9],
            };
          } else if (name.includes("2154")) {
            boundingBoxes = {
              "EPSG:2154": [650796.4, 7060330.6, 690891.3, 7090402.2],
            };
          } else {
            boundingBoxes = {
              "CRS:84": [2.3, 50.6, 2.8, 50.9],
              "EPSG:2154": [650796.4, 7060330.6, 690891.3, 7090402.2],
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
        name: "mock_4326",
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
        name: "mock_2154",
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
        name: "mock_4326, mock_other",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);

      expect(view).toEqual({
        extent: [1, 2.6, 3.3, 50.9],
      });
    });

    it("should combine WMS sublayer extents in EPSG:4326 when their CRS differ", async () => {
      proj4.defs(
        "EPSG:2154",
        "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
      );
      const layer = {
        type: "wms",
        name: "mock_4326,mock_2154",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);
      const extent = (view as ViewByExtent).extent;

      expect(extent).toHaveLength(4);
      expect(extent.slice(0, 3)).toEqual([1, 2.6, 3.3]);
      expect(extent[3]).toBeCloseTo(50.9, 1);
    });

    it("should ignore WMS sublayers without bounding boxes", async () => {
      const layer = {
        type: "wms",
        name: "mock_4326,mock_nobbox",
        url: "http://mock/wms",
      } as MapContextLayerWms;
      const view = await createViewFromLayer(layer);

      expect(view).toEqual({
        extent: [1, 2.6, 3.3, 4.2],
      });
    });

    it("should return null when the WMS layer has no bounding boxes", async () => {
      const layer = {
        type: "wms",
        name: "mock_nobbox",
        url: "http://mock/wms",
      } as MapContextLayerWms;

      await expect(createViewFromLayer(layer)).resolves.toBeNull();
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
