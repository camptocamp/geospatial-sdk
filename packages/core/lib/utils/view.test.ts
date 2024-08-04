import { createViewFromLayer } from "./view";
import { transformExtent } from "ol/proj";
import {
  MapContextLayerGeojson,
  MapContextLayerWfs,
  MapContextLayerWms,
  MapContextLayerWmts,
} from "../model";

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
        getLayerByName: (name: string) => ({
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
        extent: transformExtent([1, 2.6, 3.3, 4.2], "EPSG:4326", "EPSG:3857"),
      });
    });

    it("should return view for WMTS layer", async () => {
      const layer = {
        type: "wmts",
        name: "mock",
        url: "http://mock/wmts",
      } as MapContextLayerWmts;
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        extent: transformExtent([1, 2.6, 3.3, 4.2], "EPSG:4326", "EPSG:3857"),
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
        data: { type: "FeatureCollection", features: [] },
      } as MapContextLayerGeojson;
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        geometry: { type: "FeatureCollection", features: [] },
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
