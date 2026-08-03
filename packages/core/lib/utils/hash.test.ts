import { getHash } from "./hash.js";

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
  it("stable for identical Date values", () => {
    const hashA = getHash(new Date("2020-01-01T00:00:00.000Z"));
    const hashB = getHash(new Date("2020-01-01T00:00:00.000Z"));
    expect(hashB).toEqual(hashA);
  });
  it("different for different Date values", () => {
    const hashA = getHash(new Date("2020-01-01T00:00:00.000Z"));
    const hashB = getHash(new Date("2021-06-15T12:30:00.000Z"));
    expect(hashB).not.toEqual(hashA);
  });
  it("different when a nested Date value changes", () => {
    const hashA = getHash({ time: new Date("2020-01-01T00:00:00.000Z") });
    const hashB = getHash({ time: new Date("2021-06-15T12:30:00.000Z") });
    expect(hashB).not.toEqual(hashA);
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
  it("stable with identical GeoJSON collection", () => {
    const hashA = getHash({
      geometry: {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: null }],
      },
    });
    const hashB = getHash({
      geometry: {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: null }],
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
  it("stable with bigint values", () => {
    const hashA = getHash({
      aa: "bb",
      cc: 9007199254740991n,
    });
    const hashB = getHash({
      aa: "bb",
      cc: 9007199254740991n,
    });
    expect(hashB).toEqual(hashA);
  });
  it("supports bigint in geojson", () => {
    const hash = getHash({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            adresse: "Façade Esplanade",
            code_insee: 59350n,
            dtdate: 1785767040000,
            etat: "OUVERT",
            geom: "POINT (703523.791143476 7060856.34054855)",
            latitude: 50.644637,
            longitude: 3.049734,
            nbr_libre: 138n,
            nbr_total: 270n,
            nom: "Petit Paradis",
            txt_aff: "95",
            ville: "LILLE",
          },
          geometry: {
            coordinates: [
              [
                [2.789133, 50.49973],
                [3.272498, 50.49973],
                [3.272498, 50.794577],
                [2.789133, 50.794577],
                [2.789133, 50.49973],
              ],
            ],
            type: "Polygon",
          },
        },
      ],
    });
    expect(hash).toBeTruthy();
  });
});
