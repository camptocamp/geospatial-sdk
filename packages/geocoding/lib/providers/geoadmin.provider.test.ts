import { GeoadminResponse, queryGeoadmin } from "./geoadmin.provider";
import { GeocodingResult } from "../model";

const RESULTS_FIXTURE: GeoadminResponse = {
  type: "FeatureCollection",
  bbox: [8.446892, 47.319034, 8.627209, 47.43514],
  features: [
    {
      geometry: {
        type: "Point",
        coordinates: [8.446892, 47.319034],
      },
      properties: {
        origin: "gazetteer",
        geom_quadindex: "021300220330313020221",
        weight: 1,
        zoomlevel: 10,
        lon: 7.459799289703369,
        detail: "wabern koeniz",
        rank: 5,
        lat: 46.925777435302734,
        num: 1,
        y: 601612.0625,
        x: 197186.8125,
        label: "<i>Populated Place</i> <b>Wabern</b> (BE) - Köniz",
        id: 215754,
      },
      type: "Feature",
      id: 215754,
      bbox: [8.446892, 47.319034, 8.627209, 47.43514],
    },
    {
      geometry: {
        type: "Point",
        coordinates: [8.446892, 47.319034],
      },
      properties: {
        origin: "gg25",
        geom_quadindex: "030003",
        weight: 6,
        zoomlevel: 4294967295,
        lon: 8.527311325073242,
        detail: "zurigo zh",
        rank: 2,
        lat: 47.37721252441406,
        num: 1,
        x: 8.527311325073242,
        y: 47.37721252441406,
        label: "<b>Zurigo (ZH)</b>",
        id: 153,
        featureId: "261",
      },
      type: "Feature",
      id: 153,
      bbox: [8.446892, 47.319034, 8.627209, 47.43514],
    },
  ],
};

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(RESULTS_FIXTURE),
  } as Response),
);

describe("queryGeoadmin", () => {
  let results: GeocodingResult[];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("results parsing", () => {
    beforeEach(async () => {
      results = await queryGeoadmin("hello");
    });
    it("produces geometries, removes html tags from labels", () => {
      expect(results).toEqual([
        {
          geom: {
            coordinates: [
              [
                [8.446892, 47.319034],
                [8.446892, 47.43514],
                [8.627209, 47.43514],
                [8.627209, 47.319034],
                [8.446892, 47.319034],
              ],
            ],
            type: "Polygon",
          },
          label: "Populated Place Wabern (BE) - Köniz",
        },
        {
          geom: {
            coordinates: [
              [
                [8.446892, 47.319034],
                [8.446892, 47.43514],
                [8.627209, 47.43514],
                [8.627209, 47.319034],
                [8.446892, 47.319034],
              ],
            ],
            type: "Polygon",
          },
          label: "Zurigo (ZH)",
        },
      ]);
    });
  });
  describe("default options", () => {
    beforeEach(async () => {
      results = await queryGeoadmin("hello world");
    });
    it("uses default options", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api3.geo.admin.ch/rest/services/api/SearchServer?geometryFormat=geojson&type=locations&searchText=hello+world&lang=en&sr=4326&origins=zipcode%2Cgg25",
      );
    });
  });
  describe("locations search", () => {
    beforeEach(async () => {
      results = await queryGeoadmin("hello world", {
        type: "locations",
        lang: "de",
        origins: ["district", "address"],
        limit: 32,
        sr: "21781",
      });
    });
    it("uses given options", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api3.geo.admin.ch/rest/services/api/SearchServer?geometryFormat=geojson&type=locations&searchText=hello+world&lang=de&sr=21781&limit=32&origins=district%2Caddress",
      );
    });
  });
  describe("feature search", () => {
    beforeEach(async () => {
      results = await queryGeoadmin("hello world", {
        type: "featuresearch",
        lang: "de",
        features: ["abc", "def"],
        limit: 32,
        sr: "21781",
      });
    });
    it("uses given options", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api3.geo.admin.ch/rest/services/api/SearchServer?geometryFormat=geojson&type=featuresearch&searchText=hello+world&lang=de&sr=21781&limit=32&features=abc%2Cdef",
      );
    });
  });
  describe("layers search", () => {
    beforeEach(async () => {
      results = await queryGeoadmin("hello world", {
        type: "layers",
        lang: "de",
        limit: 32,
        sr: "21781",
      });
    });
    it("uses given options", () => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api3.geo.admin.ch/rest/services/api/SearchServer?geometryFormat=geojson&type=layers&searchText=hello+world&lang=de&sr=21781&limit=32",
      );
    });
  });
});
