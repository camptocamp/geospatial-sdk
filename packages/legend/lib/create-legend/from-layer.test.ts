import {
  createLegendEntriesFromLayer,
  createLegendFromLayer,
  createLegendUrlFromLayer,
  hasLegendSupport,
} from "./from-layer.js";
import {
  MapContextLayer,
  MapContextLayerWms,
  MapContextLayerWmts,
} from "@geospatial-sdk/core";
import { WmtsEndpoint } from "@camptocamp/ogc-client";

// Mock dependencies
vi.mock("@camptocamp/ogc-client", () => ({
  WmtsEndpoint: class WmtsMock {
    isReady() {}
  },
}));

describe("legend", () => {
  const baseWmsLayer: MapContextLayerWms = {
    type: "wms",
    url: "https://example.com/wms",
    name: "test-layer",
  };

  const baseWmtsLayer: MapContextLayerWmts = {
    type: "wmts",
    url: "https://example.com/wmts",
    name: "test-wmts-layer",
  };

  function mockWmtsLayer(styles: unknown[]) {
    const endpoint = {
      getLayerByName: () => ({ styles }),
    } as unknown as WmtsEndpoint;
    vi.spyOn(WmtsEndpoint.prototype, "isReady").mockResolvedValue(endpoint);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hasLegendSupport", () => {
    it("returns true for a WMS layer with url and name", () => {
      expect(hasLegendSupport(baseWmsLayer)).toBe(true);
    });

    it("returns true for a WMTS layer with url and name", () => {
      expect(hasLegendSupport(baseWmtsLayer)).toBe(true);
    });

    it("returns false for an unsupported layer type", () => {
      const geojsonLayer = {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      } as unknown as MapContextLayer;
      expect(hasLegendSupport(geojsonLayer)).toBe(false);
    });

    it("returns false when the url is missing", () => {
      expect(hasLegendSupport({ ...baseWmsLayer, url: "" })).toBe(false);
    });

    it("returns false when the name is missing", () => {
      expect(hasLegendSupport({ ...baseWmsLayer, name: "" })).toBe(false);
    });
  });

  describe("createLegendUrlFromLayer", () => {
    it("builds a WMS GetLegendGraphic URL", async () => {
      const url = await createLegendUrlFromLayer(baseWmsLayer);

      expect(url).toContain("REQUEST=GetLegendGraphic");
      expect(url).toContain("SERVICE=WMS");
      expect(url).toContain("LAYER=test-layer");
    });

    it("applies custom options", async () => {
      const url = await createLegendUrlFromLayer(baseWmsLayer, {
        format: "image/jpeg",
        widthPxHint: 200,
        heightPxHint: 100,
      });

      expect(url).toContain("FORMAT=image%2Fjpeg");
      expect(url).toContain("WIDTH=200");
      expect(url).toContain("HEIGHT=100");
    });

    it("includes the STYLE parameter when the layer has a style", async () => {
      const url = await createLegendUrlFromLayer({
        ...baseWmsLayer,
        style: "my_custom_style",
      });

      expect(url).toContain("STYLE=my_custom_style");
    });

    it("resolves a WMTS legend URL", async () => {
      mockWmtsLayer([{ legendUrl: "https://example.com/legend.png" }]);

      const url = await createLegendUrlFromLayer(baseWmtsLayer);

      expect(url).toBe("https://example.com/legend.png");
    });

    it("uses the matching style legend URL when layer.style is set", async () => {
      mockWmtsLayer([
        {
          name: "default",
          legendUrl: "https://example.com/default-legend.png",
        },
        { name: "night", legendUrl: "https://example.com/night-legend.png" },
      ]);

      const url = await createLegendUrlFromLayer({
        ...baseWmtsLayer,
        style: "night",
      });

      expect(url).toBe("https://example.com/night-legend.png");
    });

    it("returns null when a WMTS layer declares no legend", async () => {
      mockWmtsLayer([]);

      const url = await createLegendUrlFromLayer(baseWmtsLayer);

      expect(url).toBeNull();
    });

    it("throws for an unsupported layer type", async () => {
      const invalidLayer = { ...baseWmsLayer, type: "invalid" as never };

      await expect(createLegendUrlFromLayer(invalidLayer)).rejects.toThrow(
        /type "invalid"/,
      );
    });

    it("throws a missing-field error (not a type error) when the url is empty", async () => {
      await expect(
        createLegendUrlFromLayer({ ...baseWmsLayer, url: "" }),
      ).rejects.toThrow(/missing url or name/);
    });

    it("throws a missing-field error (not a type error) when the name is empty", async () => {
      await expect(
        createLegendUrlFromLayer({ ...baseWmsLayer, name: "" }),
      ).rejects.toThrow(/missing url or name/);
    });

    it("propagates a failing WMTS endpoint", async () => {
      vi.spyOn(WmtsEndpoint.prototype, "isReady").mockRejectedValue(
        new Error("capabilities unreachable"),
      );

      await expect(createLegendUrlFromLayer(baseWmtsLayer)).rejects.toThrow(
        "capabilities unreachable",
      );
    });
  });

  describe("createLegendEntriesFromLayer", () => {
    it("returns a single image entry for a WMS layer", async () => {
      const entries = await createLegendEntriesFromLayer(baseWmsLayer);

      expect(entries).toHaveLength(1);
      expect(entries[0].label).toBe("test-layer");
      expect(entries[0].url).toContain("REQUEST=GetLegendGraphic");
    });

    it("returns an empty array when the layer has no legend", async () => {
      mockWmtsLayer([]);

      const entries = await createLegendEntriesFromLayer(baseWmtsLayer);

      expect(entries).toEqual([]);
    });

    it("accepts a general MapContextLayer and throws for unsupported types", async () => {
      const geojsonLayer = {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      } as unknown as MapContextLayer;

      // Compiles without a cast: the param accepts the broad MapContextLayer union.
      await expect(
        createLegendEntriesFromLayer(geojsonLayer),
      ).rejects.toThrow();
    });
  });

  describe("createLegendFromLayer (deprecated)", () => {
    it("builds a legend element with title and image for a WMS layer", async () => {
      const el = await createLegendFromLayer(baseWmsLayer);

      expect(el).toBeInstanceOf(HTMLElement);
      expect(el?.getAttribute("role")).toBe("region");
      expect(el?.querySelector("h4")?.textContent).toBe("test-layer");
      const img = el?.querySelector("img");
      expect(img?.alt).toBe("Legend for test-layer");
      expect(img?.src).toContain("REQUEST=GetLegendGraphic");
    });

    it("returns null for an unsupported layer type", async () => {
      const invalidLayer = { ...baseWmsLayer, type: "invalid" as never };

      expect(await createLegendFromLayer(invalidLayer)).toBeNull();
    });

    it("renders a message when the layer has no legend", async () => {
      mockWmtsLayer([]);

      const el = await createLegendFromLayer(baseWmtsLayer);

      expect(el?.querySelector("span")?.textContent).toBe(
        "Legend not available for test-wmts-layer",
      );
    });

    it("renders an error message when resolving fails", async () => {
      vi.spyOn(WmtsEndpoint.prototype, "isReady").mockRejectedValue(
        new Error("capabilities unreachable"),
      );

      const el = await createLegendFromLayer(baseWmtsLayer);

      expect(el?.querySelector("span")?.textContent).toBe(
        "Error loading legend for test-wmts-layer",
      );
    });

    it("renders a message when the legend image fails to load", async () => {
      const el = await createLegendFromLayer(baseWmsLayer);
      const img = el?.querySelector("img");

      img?.dispatchEvent(new Event("error"));

      expect(el?.querySelector("span")?.textContent).toBe(
        "Legend not available for test-layer",
      );
    });
  });
});
