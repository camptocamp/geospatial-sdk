import { createViewFromLayer } from "./view";
import { WmsEndpoint, WmtsEndpoint } from "@camptocamp/ogc-client";
import { transformExtent } from "ol/proj";

vitest.mock("@camptocamp/ogc-client", () => ({
  WmsEndpoint: class {
    constructor(private url) {}
    isReady() {
      return Promise.resolve({
        getLayerByName: (name) => {
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
    constructor(private url) {}
    isReady() {
      return Promise.resolve({
        getSingleLayerName: () => "layerName",
        getLayerByName: (name) => ({
          latLonBoundingBox: [1, 2.6, 3.3, 4.2],
        }),
      });
    }
  },
}));

describe("view", () => {
  describe("createViewFromLayer", () => {
    it("should return view for WMS layer", async () => {
      const layer = { type: "wms", name: "mock_4326", url: "http://mock/wms" };
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        extent: transformExtent([1, 2.6, 3.3, 4.2], "EPSG:4326", "EPSG:3857"),
      });
    });

    it("should return view for WMTS layer", async () => {
      const layer = { type: "wmts", name: "mock", url: "http://mock/wmts" };
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        extent: transformExtent([1, 2.6, 3.3, 4.2], "EPSG:4326", "EPSG:3857"),
      });
    });

    it("should return view for GeoJSON layer", async () => {
      const layer = {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      };
      const view = await createViewFromLayer(layer);
      expect(view).toEqual({
        geometry: { type: "FeatureCollection", features: [] },
      });
    });

    it("should throw error for unsupported layer type", async () => {
      const layer = { type: "unsupported" };
      await expect(createViewFromLayer(layer)).rejects.toThrow(
        "Unsupported layer type: unsupported",
      );
    });
  });
});
