import {
  getExtentFromGeojson,
  getExtentFromGeometry,
  readLayerData,
} from "./geojson.js";
import { sharedFetch, useCache } from "@camptocamp/ogc-client";
import { MapContextLayerGeojson } from "../model/index.js";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";

vi.mock("@camptocamp/ogc-client", () => ({
  useCache: vi.fn((factory: () => unknown) => factory()),
  sharedFetch: vi.fn(),
}));

describe("geojson utils", () => {
  describe("getExtentFromGeometry", () => {
    const polygon: Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [1, 1],
          [1, 4],
          [4, 4],
          [4, 1],
          [1, 1],
        ],
        [
          [2, 2],
          [2, 3],
          [130, 3],
          [130, 2],
          [2, 2],
        ],
      ],
    };
    const lineString: LineString = {
      type: "LineString",
      coordinates: [
        [10, 20],
        [20, 20],
        [50, 10],
        [100, -5],
        [-100, -100],
      ],
    };
    const point: Point = {
      type: "Point",
      coordinates: [50, -200],
    };

    it("computes the bounding box correctly for a Polygon", () => {
      const bbox = getExtentFromGeometry(polygon);
      expect(bbox).toEqual([1, 1, 130, 4]);
    });
    it("computes the bounding box correctly for a LineString", () => {
      const bbox = getExtentFromGeometry(lineString);
      expect(bbox).toEqual([-100, -100, 100, 20]);
    });
    it("computes the bounding box correctly for a Point", () => {
      const bbox = getExtentFromGeometry(point);
      expect(bbox).toEqual([50, -200, 50, -200]);
    });
    it("computes the bounding box correctly for a MultiPolygon", () => {
      const multiPolygon: MultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
          polygon.coordinates,
          [
            [
              [-20, -20],
              [-20, 30],
              [20, 30],
              [20, -20],
              [-20, -20],
            ],
          ],
        ],
      };
      const bbox = getExtentFromGeometry(multiPolygon);
      expect(bbox).toEqual([-20, -20, 130, 30]);
    });
    it("computes the bounding box correctly for a MultiLineString", () => {
      const multiLineString: MultiLineString = {
        type: "MultiLineString",
        coordinates: [
          lineString.coordinates,
          [
            [-2, -2],
            [2, 3],
            [150, 200],
            [100, 10],
          ],
        ],
      };
      const bbox = getExtentFromGeometry(multiLineString);
      expect(bbox).toEqual([-100, -100, 150, 200]);
    });
    it("computes the bounding box correctly for a MultiPoint", () => {
      const multiPoint: MultiPoint = {
        type: "MultiPoint",
        coordinates: [point.coordinates, [200, 300]],
      };
      const bbox = getExtentFromGeometry(multiPoint);
      expect(bbox).toEqual([50, -200, 200, 300]);
    });
    it("computes the bounding box correctly for a GeometryCollection", () => {
      const geom: GeometryCollection = {
        type: "GeometryCollection",
        geometries: [lineString, polygon, point],
      };
      const bbox = getExtentFromGeometry(geom);
      expect(bbox).toEqual([-100, -200, 130, 20]);
    });
  });

  describe("getExtentFromGeoJSON", () => {
    it("computes the combined extent of a FeatureCollection", () => {
      const geojson: FeatureCollection<Geometry | null> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [5, 10] },
          },
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [-2, 20] },
          },
          {
            type: "Feature",
            properties: {},
            geometry: null,
          },
        ],
      };

      expect(getExtentFromGeojson(geojson)).toEqual([-2, 10, 5, 20]);
    });

    it("computes the extent of a Feature", () => {
      const feature: Feature<Point> = {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [5, 10] },
      };

      expect(getExtentFromGeojson(feature)).toEqual([5, 10, 5, 10]);
    });

    it("computes the extent of a Geometry", () => {
      const geometry: Point = {
        type: "Point",
        coordinates: [-2, 20],
      };

      expect(getExtentFromGeojson(geometry)).toEqual([-2, 20, -2, 20]);
    });

    it("returns an empty extent for a Feature with no geometry", () => {
      const feature: Feature<null> = {
        type: "Feature",
        properties: {},
        geometry: null,
      };

      expect(getExtentFromGeojson(feature)).toEqual([
        Infinity,
        Infinity,
        -Infinity,
        -Infinity,
      ]);
    });
  });

  describe("readLayerData", () => {
    const featureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "hello" },
          geometry: { type: "Point", coordinates: [1, 2] },
        },
      ],
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe("with inline data as object", () => {
      const layer: MapContextLayerGeojson = {
        type: "geojson",
        data: featureCollection,
      };

      it("returns the data as is", async () => {
        await expect(readLayerData(layer)).resolves.toBe(featureCollection);
      });
      it("does not use the cache nor fetch anything", async () => {
        await readLayerData(layer);
        expect(useCache).not.toHaveBeenCalled();
        expect(sharedFetch).not.toHaveBeenCalled();
      });
    });

    describe("with inline data as string", () => {
      const layer: MapContextLayerGeojson = {
        type: "geojson",
        data: JSON.stringify(featureCollection),
      };

      it("returns the parsed data", async () => {
        await expect(readLayerData(layer)).resolves.toEqual(featureCollection);
      });
      it("does not use the cache nor fetch anything", async () => {
        await readLayerData(layer);
        expect(useCache).not.toHaveBeenCalled();
        expect(sharedFetch).not.toHaveBeenCalled();
      });
    });

    describe("with invalid JSON as string", () => {
      const layer: MapContextLayerGeojson = {
        type: "geojson",
        data: "blargz",
      };

      it("rejects with an explicit error", async () => {
        await expect(readLayerData(layer)).rejects.toThrow(
          "GeoJSON layer data parsing failed: SyntaxError: Unexpected token 'b', \"blargz\" is not valid JSON",
        );
      });
    });

    describe("with remote url", () => {
      const layer: MapContextLayerGeojson = {
        type: "geojson",
        url: "https://my.host.com/data/regions.json",
      };

      beforeEach(() => {
        vi.mocked(sharedFetch).mockResolvedValue({
          json: () => Promise.resolve(featureCollection),
        } as Response);
      });

      it("fetches the url", async () => {
        await readLayerData(layer);
        expect(sharedFetch).toHaveBeenCalledWith(
          "https://my.host.com/data/regions.json",
        );
      });
      it("returns the fetched data", async () => {
        await expect(readLayerData(layer)).resolves.toEqual(featureCollection);
      });
      it("caches the fetched data using the url as key", async () => {
        await readLayerData(layer);
        expect(useCache).toHaveBeenCalledWith(
          expect.any(Function),
          "getGeojsonFromUrl",
          "https://my.host.com/data/regions.json",
        );
      });

      describe("when the request fails", () => {
        beforeEach(() => {
          vi.mocked(sharedFetch).mockRejectedValue(new Error("Network error"));
        });
        it("rejects with the error", async () => {
          await expect(readLayerData(layer)).rejects.toThrow("Network error");
        });
      });

      describe("when the response is not valid JSON", () => {
        beforeEach(() => {
          vi.mocked(sharedFetch).mockResolvedValue({
            json: () =>
              Promise.reject(new SyntaxError("could not convert JSON")),
          } as Response);
        });
        it("rejects with the error", async () => {
          await expect(readLayerData(layer)).rejects.toThrow(
            "GeoJSON layer data parsing failed: SyntaxError: could not convert JSON",
          );
        });
      });
    });

    describe("when the provided JSON is not valid GeoJSON", () => {
      it("rejects with an explicit error", async () => {
        const layer: MapContextLayerGeojson = {
          type: "geojson",
          data: JSON.stringify({ type: "NotAValidGeoJSON" }),
        };
        await expect(readLayerData(layer)).rejects.toThrow(
          "GeoJSON layer data is not a valid GeoJSON object",
        );
      });
      it("converts a single feature to a feature collection", async () => {
        const layer: MapContextLayerGeojson = {
          type: "geojson",
          data: JSON.stringify({
            type: "Feature",
            properties: {
              hello: "world",
            },
          }),
        };
        expect(await readLayerData(layer)).toEqual({
          features: [
            {
              properties: {
                hello: "world",
              },
              type: "Feature",
            },
          ],
          type: "FeatureCollection",
        });
      });
    });
  });
});
