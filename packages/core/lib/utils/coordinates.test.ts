import {
  equals,
  extend,
  getCrs,
  setCrs,
  toGeographic,
  transform,
} from "./coordinates.js";
import { Coordinate, Extent } from "../model/index.js";

describe("crs utils", () => {
  describe("getCrs", () => {
    it("defaults to EPSG:4326 when no CRS is given", () => {
      expect(getCrs([1, 2])).toBe("EPSG:4326");
      expect(getCrs([1, 2, 3, 4])).toBe("EPSG:4326");
    });
    it("reads the CRS from the last element", () => {
      expect(getCrs([1, 2, "EPSG:2154"])).toBe("EPSG:2154");
      expect(getCrs([1, 2, 3, 4, "EPSG:2154"])).toBe("EPSG:2154");
    });
  });

  describe("setCrs", () => {
    it("applies the CRS to a coordinate without transforming it", () => {
      expect(setCrs([2.3, 48.8], "EPSG:3857")).toEqual([
        2.3,
        48.8,
        "EPSG:3857",
      ]);
    });

    it("applies the CRS to an extent without transforming it", () => {
      expect(setCrs([1, 2, 3, 4], "EPSG:3857")).toEqual([
        1,
        2,
        3,
        4,
        "EPSG:3857",
      ]);
    });

    it("replaces the CRS when one is already present", () => {
      expect(setCrs([2.3, 48.8, "EPSG:4326"], "EPSG:3857")).toEqual([
        2.3,
        48.8,
        "EPSG:3857",
      ]);
      expect(setCrs([1, 2, 3, 4, "EPSG:4326"], "EPSG:3857")).toEqual([
        1,
        2,
        3,
        4,
        "EPSG:3857",
      ]);
    });

    it("returns the original value when its CRS is unchanged", () => {
      const coordinate = [2.3, 48.8, "EPSG:4326"] as Coordinate;
      const extent = [1, 2, 3, 4, "EPSG:4326"] as Extent;

      expect(setCrs(coordinate, "EPSG:4326")).toBe(coordinate);
      expect(setCrs(extent, "EPSG:4326")).toBe(extent);
    });
  });

  describe("extend", () => {
    it("expands the first extent to include the second", () => {
      const extent = [1, 2, 3, 4] as [number, number, number, number];

      expect(extend(extent, [-1, 3, 2, 8])).toBe(extent);
      expect(extent).toEqual([-1, 2, 3, 8]);
    });

    it("throws when extents use different CRSs", () => {
      expect(() => extend([1, 2, 3, 4], [5, 6, 7, 8, "EPSG:3857"])).toThrow(
        "Cannot combine extents with different CRS",
      );
    });
  });

  describe("transform", () => {
    it("returns the input unchanged when it is already in the target CRS", () => {
      const coordinate = [2.3, 48.8, "EPSG:4326"] as Coordinate;
      expect(transform(coordinate, "EPSG:4326")).toBe(coordinate);
    });

    it("transforms a coordinate to the target CRS", () => {
      const result = transform([1, 1], "EPSG:3857");

      expect(result[0]).toBeCloseTo(111319.4908);
      expect(result[1]).toBeCloseTo(111325.1429);
      expect(result[2]).toBe("EPSG:3857");
    });

    it("transforms an extent to the target CRS", () => {
      const result = transform([0, 0, 1, 1], "EPSG:3857");

      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(111319.4908);
      expect(result[3]).toBeCloseTo(111325.1429);
      expect(result[4]).toBe("EPSG:3857");
    });

    it("throws an error when the CRS cannot be converted", () => {
      expect(() => transform([1, 2, "EPSG:999999"], "EPSG:4326")).toThrow(
        "Cannot convert from EPSG:999999 to EPSG:4326",
      );
    });
  });

  describe("toGeographic", () => {
    it("returns coordinates and extents in EPSG:4326 and strips the CRS identifier", () => {
      expect(toGeographic([2.3, 48.8])).toEqual([2.3, 48.8]);
      expect(toGeographic([2.3, 48.8, "EPSG:4326"])).toEqual([2.3, 48.8]);
      expect(toGeographic([2.3, 48.8, 3.3, 49.8])).toEqual([
        2.3, 48.8, 3.3, 49.8,
      ]);
      expect(toGeographic([2.3, 48.8, 3.3, 49.8, "EPSG:4326"])).toEqual([
        2.3, 48.8, 3.3, 49.8,
      ]);
    });

    it("converts a coordinate from its declared CRS to EPSG:4326", () => {
      const result = toGeographic([
        111319.49079327357,
        111325.1428663851,
        "EPSG:3857",
      ]);

      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(1);
    });

    it("converts an extent from its declared CRS to EPSG:4326", () => {
      const result = toGeographic([
        0,
        0,
        111319.49079327357,
        111325.1428663851,
        "EPSG:3857",
      ]);

      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(1);
      expect(result[3]).toBeCloseTo(1);
    });

    it("throws an error when the CRS cannot be converted", () => {
      expect(() => toGeographic([1, 2, "EPSG:999999"])).toThrow(
        "Cannot convert from EPSG:999999 to EPSG:4326",
      );
    });
  });

  describe("equals", () => {
    it("compares coordinates and their CRS", () => {
      expect(equals([2.3, 48.8], [2.3, 48.8])).toBe(true);
      expect(equals([2.3, 48.8], [2.3, 48.8, "EPSG:4326"])).toBe(true);
      expect(equals([2.3, 48.8], [2.4, 48.8])).toBe(false);
      expect(equals([2.3, 48.8], [2.3, 48.8, "EPSG:3857"])).toBe(false);
    });

    it("compares extents and their CRS", () => {
      expect(equals([1, 2, 3, 4], [1, 2, 3, 4])).toBe(true);
      expect(equals([1, 2, 3, 4], [1, 2, 3, 4, "EPSG:4326"])).toBe(true);
      expect(equals([1, 2, 3, 4], [1, 2, 3, 5])).toBe(false);
      expect(equals([1, 2, 3, 4], [1, 2, 3, 4, "EPSG:3857"])).toBe(false);
    });
  });
});
