import { createXyzFromTms } from "./tms";

vitest.mock("@camptocamp/ogc-client", () => ({
  TmsEndpoint: class {
    constructor(private url: string) {}

    get allTileMaps() {
      return Promise.resolve([
        {
          title: "states",
          srs: "EPSG:4326",
          href: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/topp%3Astates@EPSG%3A4326@png",
        },
        {
          title: "countries",
          srs: "EPSG:4326",
          href: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/topp%3Acountries@EPSG%3A4326@jpeg",
        },
      ]);
    }

    getTileMapInfo(href: string) {
      if (href.includes("states")) {
        return Promise.resolve({
          title: "states",
          tileFormat: {
            extension: "png",
            mimeType: "image/png",
          },
          tileSets: [
            {
              href: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/topp%3Astates@EPSG%3A4326@png/0",
              order: 0,
            },
            {
              href: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/topp%3Astates@EPSG%3A4326@png/1",
              order: 1,
            },
          ],
        });
      } else if (href.includes("countries")) {
        return Promise.resolve({
          title: "countries",
          tileFormat: {
            extension: "jpeg",
            mimeType: "image/jpeg",
          },
          tileSets: [
            {
              href: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/topp%3Acountries@EPSG%3A4326@jpeg/0",
              order: 0,
            },
          ],
        });
      }
      throw new Error("TileMap not found");
    }
  },
}));

describe("tms", () => {
  describe("createXyzFromTms", () => {
    it("should create MapContextLayerXyz from TMS endpoint with PNG tiles", async () => {
      const layer = await createXyzFromTms(
        "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0",
        "states",
        "EPSG:4326",
      );

      expect(layer).toEqual({
        type: "xyz",
        url: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/topp%3Astates@EPSG%3A4326@png/{z}/{x}/{y}.png",
      });
    });

    it("should create MapContextLayerXyz from TMS endpoint with JPEG tiles", async () => {
      const layer = await createXyzFromTms(
        "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0",
        "countries",
        "EPSG:4326",
      );

      expect(layer).toEqual({
        type: "xyz",
        url: "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/topp%3Acountries@EPSG%3A4326@jpeg/{z}/{x}/{y}.jpeg",
      });
    });

    it("should throw error when TileMap name not found", async () => {
      await expect(
        createXyzFromTms(
          "https://ahocevar.com/geoserver/gwc/service/tms/1.0.0",
          "non-existent",
          "EPSG:4326",
        ),
      ).rejects.toThrow(
        'TileMap with title "non-existent" not found in TMS endpoint',
      );
    });
  });
});
