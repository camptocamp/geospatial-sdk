import { queryMarineRegions } from "./marine-regions.provider.js";

const BASE_URL =
  "https://www.marineregions.org/rest/getGazetteerRecordsByName.json";

// real records returned by the service for "hawa"
const WITH_BOX = {
  MRGID: 8679,
  gazetteerSource: "Getty thesaurus of geographic names",
  placeType: "State",
  latitude: 20.58232,
  longitude: -157.5229,
  minLatitude: 18.92548,
  minLongitude: -160.2479,
  maxLatitude: 22.23915,
  maxLongitude: -154.7978,
  precision: 338282.6,
  preferredGazetteerName: "Hawaii",
  preferredGazetteerNameLang: "English",
  status: "standard",
  accepted: 8679,
};
const WITH_POINT_ONLY = {
  ...WITH_BOX,
  MRGID: 20127,
  placeType: "Island",
  latitude: 19.5,
  longitude: -155.5,
  minLatitude: null,
  minLongitude: null,
  maxLatitude: null,
  maxLongitude: null,
};
const WITH_SWAPPED_BOX = {
  ...WITH_BOX,
  MRGID: 15270,
  preferredGazetteerName: "Hawaiian Islands",
  minLatitude: 17.69,
  minLongitude: -153.73,
  maxLatitude: 22.5,
  maxLongitude: -161.01,
};
const ACROSS_ANTIMERIDIAN = {
  ...WITH_BOX,
  MRGID: 8453,
  preferredGazetteerName: "Hawaiian Exclusive Economic Zone",
  latitude: 24.04099,
  longitude: -166.40647,
  minLatitude: 15.56312,
  minLongitude: 177.84421,
  maxLatitude: 31.79787,
  maxLongitude: -151.2768,
};
const WITHOUT_POSITION = {
  ...WITH_POINT_ONLY,
  MRGID: 18930,
  preferredGazetteerName: "Hawaii Islands",
  latitude: null,
  longitude: null,
  status: "deleted",
};

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: "status text",
        json: () => Promise.resolve(body),
      } as unknown as Response),
    ),
  );
}

describe("queryMarineRegions", () => {
  describe("results parsing", () => {
    it("uses the name as label and keeps the other fields as properties", async () => {
      mockFetch(200, [WITH_BOX]);
      const [result] = await queryMarineRegions("hawa");
      const { preferredGazetteerName, ...properties } = WITH_BOX;
      expect(result.label).toBe(preferredGazetteerName);
      expect(result.properties).toEqual(properties);
    });
    it("returns the bounding box as a polygon", async () => {
      mockFetch(200, [WITH_BOX]);
      const [result] = await queryMarineRegions("hawa");
      expect(result.geom).toEqual({
        type: "Polygon",
        coordinates: [
          [
            [-160.2479, 18.92548],
            [-154.7978, 18.92548],
            [-154.7978, 22.23915],
            [-160.2479, 22.23915],
            [-160.2479, 18.92548],
          ],
        ],
      });
    });
    it("returns a point when there is no bounding box", async () => {
      mockFetch(200, [WITH_POINT_ONLY]);
      const [result] = await queryMarineRegions("hawa");
      expect(result.geom).toEqual({
        type: "Point",
        coordinates: [-155.5, 19.5],
      });
    });
    it("puts a swapped bounding box back in order", async () => {
      mockFetch(200, [WITH_SWAPPED_BOX]);
      const [result] = await queryMarineRegions("hawa");
      expect(result.geom).toEqual({
        type: "Polygon",
        coordinates: [
          [
            [-161.01, 17.69],
            [-153.73, 17.69],
            [-153.73, 22.5],
            [-161.01, 22.5],
            [-161.01, 17.69],
          ],
        ],
      });
    });
    it("returns a point when the bounding box crosses the antimeridian", async () => {
      mockFetch(200, [ACROSS_ANTIMERIDIAN]);
      const [result] = await queryMarineRegions("hawa");
      expect(result.geom).toEqual({
        type: "Point",
        coordinates: [-166.40647, 24.04099],
      });
    });
    it("returns a null geometry when there is no position", async () => {
      mockFetch(200, [WITHOUT_POSITION]);
      const [result] = await queryMarineRegions("hawa");
      expect(result.geom).toBeNull();
    });
  });

  describe("request", () => {
    beforeEach(() => {
      mockFetch(200, []);
    });
    it("sends no option by default", async () => {
      await queryMarineRegions("hawa");
      expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE_URL}/hawa/`);
    });
    it("sends the given options", async () => {
      await queryMarineRegions("hawa", {
        like: false,
        fuzzy: true,
        typeID: [70, 254],
        language: "fr",
        offset: 0,
        count: 20,
      });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/hawa/?like=false&fuzzy=true&typeID=70%2C254&language=fr&offset=0&count=20`,
      );
    });
    it("accepts a single place type", async () => {
      await queryMarineRegions("hawa", { typeID: 70 });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/hawa/?typeID=70`,
      );
    });
    it("trims and encodes the input", async () => {
      await queryMarineRegions("  côte d'azur/b?  ");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/c%C3%B4te%20d'azur%2Fb%3F/`,
      );
    });
  });

  describe("no result", () => {
    it("returns an empty list when the service answers 404", async () => {
      mockFetch(404, []);
      expect(await queryMarineRegions("zzzz")).toEqual([]);
    });
  });

  describe("errors", () => {
    it("rejects an empty input without calling the service", async () => {
      mockFetch(200, [WITH_BOX]);
      await expect(queryMarineRegions("   ")).rejects.toThrow(
        "Input query is required and cannot be empty.",
      );
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
    it("rejects when the service answers with an error", async () => {
      mockFetch(500, []);
      await expect(queryMarineRegions("hawa")).rejects.toThrow(
        "Marine Regions API returned 500: status text",
      );
    });
    it("rejects when the response is not a list", async () => {
      mockFetch(200, { error: "unexpected" });
      await expect(queryMarineRegions("hawa")).rejects.toThrow(
        'Invalid response from Marine Regions API: {"error":"unexpected"}',
      );
    });
  });
});
