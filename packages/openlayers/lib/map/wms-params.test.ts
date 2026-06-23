import { describe, it, expect } from "vitest";
import { buildWmsParams } from "./wms-params.js";
import { MapContextLayerWms } from "@geospatial-sdk/core";

const BASE_LAYER: MapContextLayerWms = {
  type: "wms",
  url: "https://example.com/wms",
  name: "temperature",
};

describe("buildWmsParams", () => {
  it("includes LAYERS from layer name", () => {
    expect(buildWmsParams(BASE_LAYER)).toMatchObject({ LAYERS: "temperature" });
  });

  it("includes FORMAT when set", () => {
    expect(
      buildWmsParams({ ...BASE_LAYER, format: "image/png" }),
    ).toMatchObject({ FORMAT: "image/png" });
  });

  it("omits FORMAT when not set", () => {
    expect(buildWmsParams(BASE_LAYER)).not.toHaveProperty("FORMAT");
  });

  it("includes STYLES when set", () => {
    expect(
      buildWmsParams({ ...BASE_LAYER, style: "boxfill/rainbow" }),
    ).toMatchObject({ STYLES: "boxfill/rainbow" });
  });

  it("omits STYLES when not set", () => {
    expect(buildWmsParams(BASE_LAYER)).not.toHaveProperty("STYLES");
  });

  describe("dimensionValues", () => {
    it("uppercases dimension keys", () => {
      expect(
        buildWmsParams({
          ...BASE_LAYER,
          dimensionValues: { time: "2023-01-01", elevation: "-10" },
        }),
      ).toMatchObject({ TIME: "2023-01-01", ELEVATION: "-10" });
    });

    it("serializes Date values to ISO strings", () => {
      const date = new Date("2023-06-15T12:00:00Z");
      expect(
        buildWmsParams({ ...BASE_LAYER, dimensionValues: { time: date } }),
      ).toMatchObject({ TIME: "2023-06-15T12:00:00.000Z" });
    });
  });

  describe("customParams", () => {
    it("spreads customParams as-is into the result", () => {
      expect(
        buildWmsParams({
          ...BASE_LAYER,
          customParams: { COLORSCALERANGE: "-2,35", LOGSCALE: "false" },
        }),
      ).toMatchObject({ COLORSCALERANGE: "-2,35", LOGSCALE: "false" });
    });

    it("omits nothing when customParams is absent", () => {
      const result = buildWmsParams(BASE_LAYER);
      expect(result).not.toHaveProperty("COLORSCALERANGE");
      expect(result).not.toHaveProperty("LOGSCALE");
    });

    it("customParams can override standard params", () => {
      // Explicit vendor override takes precedence over the derived STYLES value
      expect(
        buildWmsParams({
          ...BASE_LAYER,
          style: "boxfill/rainbow",
          customParams: { STYLES: "contour" },
        }),
      ).toMatchObject({ STYLES: "contour" });
    });
  });
});
