import {
  ensureGeojson,
  getExtentFromGeojson,
  getExtentFromGeometry,
} from "./geojson.js";
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

describe("geojson utils", () => {
  describe("ensureGeojson", () => {
    it("should return the same object if it is a valid GeoJSON", () => {
      const geojson = {
        type: "FeatureCollection",
        features: [],
      } as FeatureCollection;
      expect(ensureGeojson(geojson)).toBe(geojson);
    });

    it("should parse a GeoJSON string into an object", () => {
      const geojsonString = JSON.stringify({
        type: "FeatureCollection",
        features: [],
      });
      expect(ensureGeojson(geojsonString)).toEqual({
        type: "FeatureCollection",
        features: [],
      });
    });

    it("should throw if the geojson string is invalid", () => {
      const invalidGeojson = "hello: world";
      expect(() => ensureGeojson(invalidGeojson)).toThrow(
        "Invalid GeoJSON string: SyntaxError: Unexpected token 'h', \"hello: world\" is not valid JSON",
      );
    });
  });

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
});
