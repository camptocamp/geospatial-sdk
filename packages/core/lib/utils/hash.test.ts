import { getHash } from "./hash";

describe("getHash", () => {
  it("generates a hash representing the deep value of an object", () => {
    const hashA = getHash({ a: 1, b: 2, c: "abcd", d: ["a", "b", "c"] });
    const hashB = getHash({ a: 1, b: 200, c: "abcd", d: ["a", "b", "c"] });
    expect(hashB).not.toEqual(hashA);
  });
  it("returns a stable hash regardless of properties order", () => {
    const hashA = getHash({ a: 1, b: 2, c: "abcd" });
    const hashB = getHash({ c: "abcd", b: 2, a: 1 });
    expect(hashB).toEqual(hashA);
  });
  it("takes into account array order", () => {
    const hashA = getHash({ a: ["a", "b", "c"] });
    const hashB = getHash({ a: ["b", "a", "c"] });
    expect(hashB).not.toEqual(hashA);
  });
  it("ignores properties on demand", () => {
    const hashA = getHash({ a: 1, b: 2, c: "abcd", d: ["a", "b", "c"] }, ["b"]);
    const hashB = getHash({ c: "abcd", b: 2000, a: 1, d: ["a", "b", "c"] }, [
      "b",
    ]);
    expect(hashB).toEqual(hashA);
  });
  it("stable for null", () => {
    const hashA = getHash(null);
    const hashB = getHash(null);
    expect(hashB).toEqual(hashA);
  });
  it("different when casting null to string", () => {
    const hashA = getHash(null);
    const hashB = getHash("null");
    expect(hashB).not.toEqual(hashA);
  });
  it("stable with identical GeoJSON geometry", () => {
    const hashA = getHash({
      geometry: {
        type: "Polygon",
        properties: {},
        coordinates: [
          [
            [-10, -10],
            [-10, 20],
            [10, 20],
            [10, -10],
            [-10, -10],
          ],
        ],
      },
    });
    const hashB = getHash({
      geometry: {
        type: "Polygon",
        properties: {},
        coordinates: [
          [
            [-10, -10],
            [-10, 20],
            [10, 20],
            [10, -10],
            [-10, -10],
          ],
        ],
      },
    });
    expect(hashB).toEqual(hashA);
  });
  it("different if GeoJSON geometry properties are not in the same order", () => {
    const hashA = getHash({
      geometry: {
        coordinates: [
          [
            [-10, -10],
            [-10, 20],
            [10, 20],
            [10, -10],
            [-10, -10],
          ],
        ],
        type: "Polygon",
        properties: {},
      },
    });
    const hashB = getHash({
      geometry: {
        type: "Polygon",
        properties: {},
        coordinates: [
          [
            [-10, -10],
            [-10, 20],
            [10, 20],
            [10, -10],
            [-10, -10],
          ],
        ],
      },
    });
    expect(hashB).not.toEqual(hashA);
  });
});
