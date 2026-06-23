import { createLegendFromLayer, hasLegendSupport } from "./from-layer.js";
import {
  MapContextLayer,
  MapContextLayerWms,
  MapContextLayerWmts,
} from "@geospatial-sdk/core";
import { WmsEndpoint, WmtsEndpoint } from "@camptocamp/ogc-client";

// Mock dependencies. Both endpoints default to advertising no legend, so WMS
// falls back to a GetLegendGraphic request unless a test says otherwise.
vi.mock("@camptocamp/ogc-client", () => ({
  WmsEndpoint: class WmsMock {
    isReady() {
      return Promise.resolve({ getLayerByName: () => null });
    }
  },
  WmtsEndpoint: class WmtsMock {
    isReady() {}
  },
}));

describe("hasLegendSupport", () => {
  it("returns true for wms layer", () => {
    const layer: MapContextLayer = {
      type: "wms",
      url: "https://example.com/wms",
      name: "layer",
    };
    expect(hasLegendSupport(layer)).toBe(true);
  });

  it("returns true for wmts layer", () => {
    const layer: MapContextLayer = {
      type: "wmts",
      url: "https://example.com/wmts",
      name: "layer",
    };
    expect(hasLegendSupport(layer)).toBe(true);
  });

  it("returns false for wfs layer", () => {
    const layer: MapContextLayer = {
      type: "wfs",
      url: "https://example.com/wfs",
      featureType: "layer",
    };
    expect(hasLegendSupport(layer)).toBe(false);
  });

  it("returns false for xyz layer", () => {
    const layer: MapContextLayer = {
      type: "xyz",
      url: "https://example.com/xyz/{z}/{x}/{y}.png",
    };
    expect(hasLegendSupport(layer)).toBe(false);
  });

  it("returns false for geojson layer", () => {
    const layer: MapContextLayer = {
      type: "geojson",
      url: "https://example.com/data.geojson",
    };
    expect(hasLegendSupport(layer)).toBe(false);
  });

  it("returns false for ogcapi layer", () => {
    const layer: MapContextLayer = {
      type: "ogcapi",
      url: "https://example.com/ogcapi",
      collection: "col",
    };
    expect(hasLegendSupport(layer)).toBe(false);
  });

  it("returns false for maplibre-style layer", () => {
    const layer: MapContextLayer = {
      type: "maplibre-style",
      styleUrl: "https://example.com/style.json",
    };
    expect(hasLegendSupport(layer)).toBe(false);
  });

  it("returns false for geotiff layer", () => {
    const layer: MapContextLayer = {
      type: "geotiff",
      url: "https://example.com/raster.tif",
    };
    expect(hasLegendSupport(layer)).toBe(false);
  });
});

describe("createLegendFromLayer", () => {
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

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it("creates a legend for a valid WMS layer", async () => {
    const result = await createLegendFromLayer(baseWmsLayer);

    expect(result).toBeInstanceOf(HTMLElement);

    const legendDiv = result as HTMLElement;
    const img = legendDiv.querySelector("img");
    const title = legendDiv.querySelector("h4");

    expect(title?.textContent).toBe("test-layer");
    expect(img).toBeTruthy();
    expect(img?.src).toContain("REQUEST=GetLegendGraphic");
    expect(img?.alt).toBe("Legend for test-layer");
  });

  it("creates a legend for a valid WMS layer with custom options", async () => {
    const result = await createLegendFromLayer(baseWmsLayer, {
      format: "image/jpeg",
      widthPxHint: 200,
      heightPxHint: 100,
    });

    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toContain("FORMAT=image%2Fjpeg");
    expect(img?.src).toContain("WIDTH=200");
    expect(img?.src).toContain("HEIGHT=100");
  });

  it("includes STYLE parameter in WMS legend URL when layer has a style", async () => {
    const result = await createLegendFromLayer({
      ...baseWmsLayer,
      style: "my_custom_style",
    });

    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toContain("STYLE=my_custom_style");
  });

  it("prefers the LegendURL advertised in WMS capabilities", async () => {
    const mockLegendUrl = "https://example.com/wms-legend.png";
    vi.spyOn(WmsEndpoint.prototype, "isReady").mockResolvedValue({
      getLayerByName: () => ({ styles: [{ legendUrl: mockLegendUrl }] }),
    } as unknown as WmsEndpoint);

    const result = await createLegendFromLayer(baseWmsLayer);
    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toBe(mockLegendUrl);
  });

  it("uses matching style LegendURL for WMS layer when layer.style is set", async () => {
    vi.spyOn(WmsEndpoint.prototype, "isReady").mockResolvedValue({
      getLayerByName: () => ({
        styles: [
          { name: "default", legendUrl: "https://example.com/default.png" },
          { name: "night", legendUrl: "https://example.com/night.png" },
        ],
      }),
    } as unknown as WmsEndpoint);

    const result = await createLegendFromLayer({
      ...baseWmsLayer,
      style: "night",
    });
    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toBe("https://example.com/night.png");
  });

  it("falls back to GetLegendGraphic when WMS capabilities advertise no legend", async () => {
    vi.spyOn(WmsEndpoint.prototype, "isReady").mockResolvedValue({
      getLayerByName: () => ({ styles: [] }),
    } as unknown as WmsEndpoint);

    const result = await createLegendFromLayer(baseWmsLayer);
    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toContain("REQUEST=GetLegendGraphic");
  });

  it("falls back to GetLegendGraphic when WMS capabilities cannot be read", async () => {
    vi.spyOn(WmsEndpoint.prototype, "isReady").mockRejectedValue(
      new Error("network"),
    );

    const result = await createLegendFromLayer(baseWmsLayer);
    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toContain("REQUEST=GetLegendGraphic");
  });

  it("creates a legend for a valid WMTS layer with legend URL", async () => {
    const mockLegendUrl = "https://example.com/legend.png";
    const mockIsReady = {
      getLayerByName: () => ({
        styles: [{ legendUrl: mockLegendUrl }],
      }),
    } as unknown as WmtsEndpoint;

    // Mock WmtsEndpoint
    vi.spyOn(WmtsEndpoint.prototype, "isReady").mockImplementation(function () {
      return Promise.resolve(mockIsReady);
    });

    const result = await createLegendFromLayer(baseWmtsLayer);

    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toBe(mockLegendUrl);
  });

  it("handles WMTS layer without legend URL", async () => {
    const mockIsReady = {
      getLayerByName: () => ({
        styles: [],
      }),
    } as unknown as WmtsEndpoint;

    // Mock WmtsEndpoint
    vi.spyOn(WmtsEndpoint.prototype, "isReady").mockImplementation(function () {
      return Promise.resolve(mockIsReady);
    });

    const result = await createLegendFromLayer(baseWmtsLayer);

    const errorSpan = (result as HTMLElement).querySelector("span");

    expect(result).toBeInstanceOf(HTMLElement);
    expect(errorSpan?.textContent).toBe(
      "Legend not available for test-wmts-layer",
    );
  });

  it("uses matching style legend URL for WMTS layer when layer.style is set", async () => {
    const mockIsReady = {
      getLayerByName: () => ({
        styles: [
          {
            name: "default",
            legendUrl: "https://example.com/default-legend.png",
          },
          { name: "night", legendUrl: "https://example.com/night-legend.png" },
        ],
      }),
    } as unknown as WmtsEndpoint;

    vi.spyOn(WmtsEndpoint.prototype, "isReady").mockImplementation(function () {
      return Promise.resolve(mockIsReady);
    });

    const result = await createLegendFromLayer({
      ...baseWmtsLayer,
      style: "night",
    });
    const img = (result as HTMLElement).querySelector("img");

    expect(img?.src).toBe("https://example.com/night-legend.png");
  });

  it("returns null for invalid layer type", async () => {
    const invalidLayer = { ...baseWmsLayer, type: "invalid" as any };

    const result = await createLegendFromLayer(invalidLayer);

    expect(result).toBe(null);
  });

  it("returns null for layer without URL", async () => {
    const layerWithoutUrl = { ...baseWmsLayer, url: "" };

    const result = await createLegendFromLayer(layerWithoutUrl);

    expect(result).toBe(null);
  });

  it("returns null for layer without name", async () => {
    const layerWithoutName = { ...baseWmsLayer, name: "" };

    const result = await createLegendFromLayer(layerWithoutName);

    expect(result).toBe(null);
  });

  it("handles image load error", async () => {
    const result = await createLegendFromLayer(baseWmsLayer);
    const img = (result as HTMLElement).querySelector("img");

    if (img) {
      const errorEvent = new Event("error");
      img.dispatchEvent(errorEvent);

      const errorSpan = (result as HTMLElement).querySelector("span");
      expect(errorSpan?.textContent).toBe(
        "Legend not available for test-layer",
      );
    }
  });

  it("adds accessibility attributes", async () => {
    const result = await createLegendFromLayer(baseWmsLayer);

    expect(result?.getAttribute("role")).toBe("region");
    expect(result?.getAttribute("aria-label")).toBe("Map Layer Legend");
  });
});
