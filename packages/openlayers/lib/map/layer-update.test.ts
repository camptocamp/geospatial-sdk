import { canDoIncrementalUpdate } from "./layer-update.js";
import { MapContextLayer } from "@geospatial-sdk/core";

describe("Layer update utils", () => {
  describe("canDoIncrementalUpdate", () => {
    it("returns true if only updatable properties are changed", () => {
      const oldLayer = {
        name: "layer1",
        type: "wms",
        url: "https://example.com/wms",
        opacity: 0.5,
        visibility: true,
        label: "Layer 1",
      } as MapContextLayer;
      const newLayer = {
        name: "layer1",
        type: "wms",
        url: "https://example.com/wms",
        opacity: 0.8,
        label: "Layer 1 Updated",
        extras: { hello: "world" },
      } as MapContextLayer;
      expect(canDoIncrementalUpdate(oldLayer, newLayer)).toBe(true);
    });
    it("returns false if non-updatable properties are changed", () => {
      const oldLayer = {
        name: "layer1",
        type: "wms",
        url: "https://example.com/wms",
        opacity: 0.5,
        visibility: true,
        label: "Layer 1",
      } as MapContextLayer;
      const newLayer = {
        name: "layer1",
        type: "wms",
        url: "https://example.com/wms/CHANGED",
        opacity: 0.5,
        visibility: true,
        label: "Layer 1",
      } as MapContextLayer;
      expect(canDoIncrementalUpdate(oldLayer, newLayer)).toBe(false);
    });
  });
});
