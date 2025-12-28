import { queryGeonames } from "./geonames.provider.js";
import { GeocodingResult } from "../model/index.js";
import { describe } from "vitest";

const MOCK_DATA = {
  totalResultsCount: 35,
  geonames: [
    {
      adminCode1: "ZH",
      lng: "8.55",
      geonameId: 2657896,
      toponymName: "Zürich",
      countryId: "2658434",
      fcl: "P",
      population: 341730,
      countryCode: "CH",
      name: "Zurich",
      fclName: "city, village...",
      adminCodes1: { ISO3166_2: "ZH" },
      countryName: "Switzerland",
      fcodeName: "seat of a first-order administrative division",
      adminName1: "Zurich",
      lat: "47.36667",
      fcode: "PPLA",
    },
    {
      adminCode1: "ZH",
      lng: "8.66667",
      geonameId: 2657895,
      toponymName: "Kanton Zürich",
      countryId: "2658434",
      fcl: "A",
      population: 1553423,
      countryCode: "CH",
      name: "Zurich",
      fclName: "country, state, region...",
      adminCodes1: { ISO3166_2: "ZH" },
      countryName: "Switzerland",
      fcodeName: "first-order administrative division",
      adminName1: "Zurich",
      lat: "47.41667",
      fcode: "ADM1",
    },
  ],
};

vi.stubGlobal(
  "fetch",
  vi.fn(
    () =>
      Promise.resolve({
        ok: true, // Ensure the mock reflects a successful response
        json: () => Promise.resolve(MOCK_DATA),
      }) as unknown as Response,
  ),
);

describe("queryGeonames", () => {
  let results: GeocodingResult[];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("results parsing", () => {
    beforeEach(async () => {
      results = await queryGeonames("Zurich");
    });
    it("correctly processes Geonames API response", () => {
      expect(results).toEqual([
        {
          label: "Zurich",
          geom: {
            type: "Point",
            coordinates: [8.55, 47.36667],
          },
        },
        {
          label: "Zurich",
          geom: {
            type: "Point",
            coordinates: [8.66667, 47.41667],
          },
        },
      ]);
    });
  });
  describe("default options", () => {
    beforeEach(async () => {
      results = await queryGeonames("Zurich");
    });
    it("uses default options", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://secure.geonames.org/searchJSON?q=Zurich&username=gn_ui&maxRows=10",
        ),
      );
    });
  });

  describe("custom options", () => {
    beforeEach(async () => {
      results = await queryGeonames("Zurich", {
        lang: "de",
        maxRows: 5,
        country: "CH",
        username: "customUser",
      });
    });
    it("uses given options for custom search", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://secure.geonames.org/searchJSON?q=Zurich&username=customUser&maxRows=5&country=CH&lang=de&style=FULL&type=json",
        ),
      );
    });
  });

  describe("bounding box search", () => {
    beforeEach(async () => {
      results = await queryGeonames("Zurich", {
        east: 10,
        west: 5,
        north: 50,
        south: 45,
        username: "customUser",
      });
    });
    it("uses given options for bounding box search", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://secure.geonames.org/searchJSON?q=Zurich&username=customUser&maxRows=10&lang=en&style=FULL&type=json&east=10&west=5&north=50&south=45",
        ),
      );
    });
  });
});
