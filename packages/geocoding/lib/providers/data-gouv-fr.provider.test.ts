import { GeocodingResult } from "../model";
import { DataGouvFrResponse, queryDataGouvFr } from "./data-gouv-fr.provider";

const RESULTS_FIXTURE: DataGouvFrResponse = {
  type: "FeatureCollection",
  version: "draft",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [2.290084, 49.897443],
      },
      properties: {
        label: "8 Boulevard du Port 80000 Amiens",
        score: 0.49159121588068583,
        housenumber: "8",
        id: "80021_6590_00008",
        type: "housenumber",
        name: "8 Boulevard du Port",
        postcode: "80000",
        citycode: "80021",
        x: 648952.58,
        y: 6977867.25,
        city: "Amiens",
        context: "80, Somme, Hauts-de-France",
        importance: 0.6706612694243868,
        street: "Boulevard du Port",
      },
    },
  ],
  attribution: "BAN",
  licence: "ODbL 1.0",
  query: "8 bd du port",
  limit: 1,
};

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(RESULTS_FIXTURE),
  } as Response),
);

describe("queryDataGouvFr", () => {
  let results: GeocodingResult[];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("results parsing", () => {
    beforeEach(async () => {
      results = await queryDataGouvFr("hello");
    });
    it("produces geometries, removes html tags from labels", () => {
      expect(results).toEqual([
        {
          geom: {
            type: "Point",
            coordinates: [2.290084, 49.897443],
          },
          label: "8 Boulevard du Port 80000 Amiens",
        },
      ]);
    });
  });
  describe("default options", () => {
    beforeEach(async () => {
      results = await queryDataGouvFr("hello world");
    });
    it("uses default options", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api-adresse.data.gouv.fr/search/?q=hello+world",
      );
    });
  });
  describe("custom options", () => {
    beforeEach(async () => {
      results = await queryDataGouvFr("hello world", {
        type: "street",
        limit: 32,
        cityCode: "12345",
        postCode: "00000",
      });
    });
    it("uses given options", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api-adresse.data.gouv.fr/search/?q=hello+world&limit=32&type=street&postcode=00000&citycode=12345",
      );
    });
  });
});
