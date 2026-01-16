import {
  canDoIncrementalUpdate,
  updateLayerProperties,
} from "./layer-update.js";
import { MapContextLayer } from "@geospatial-sdk/core";
import Layer from "ol/layer/Layer.js";
import { Source } from "ol/source.js";
import { SAMPLE_LAYER1 } from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import VectorSource from "ol/source/Vector.js";

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

  describe("updateLayerProperties", () => {
    let olLayer: Layer;
    let olSource: Source;

    beforeEach(() => {
      olSource = new VectorSource({});
      olLayer = new Layer({ source: olSource });
      vi.spyOn(olLayer, "setVisible");
      vi.spyOn(olLayer, "setOpacity");
      vi.spyOn(olLayer, "set");
      vi.spyOn(olSource, "setAttributions");
    });

    it("applies the properties defined in the layer model", () => {
      const layerModel = {
        ...SAMPLE_LAYER1,
        visibility: false,
        opacity: 0.7,
        attributions: "hello world",
        label: "Test Layer",
      } as MapContextLayer;
      updateLayerProperties(layerModel, olLayer);
      expect(olLayer.setVisible).toHaveBeenCalledWith(false);
      expect(olLayer.setOpacity).toHaveBeenCalledWith(0.7);
      expect(olLayer.set).toHaveBeenCalledWith("label", "Test Layer");
      expect(olSource.setAttributions).toHaveBeenCalledWith("hello world");
    });

    it("does not apply properties not defined in the layer model", () => {
      const layerModel = {
        type: "wms",
        url: "http://abc.org/wms",
        name: "myLayer",
        label: "Test Layer",
      } as MapContextLayer;
      updateLayerProperties(layerModel, olLayer);
      expect(olLayer.setVisible).not.toHaveBeenCalled();
      expect(olLayer.setOpacity).not.toHaveBeenCalled();
      expect(olSource.setAttributions).not.toHaveBeenCalled();
      expect(olLayer.set).toHaveBeenCalledWith("label", "Test Layer");
    });

    it("applies properties if they have changed compared to the previous model and they are defined in the new model", () => {
      const layerModel = {
        ...SAMPLE_LAYER1,
        opacity: 0.9,
        attributions: "hello world",
        label: "Test Layer",
      } as MapContextLayer;
      const prevLayerModel = {
        ...SAMPLE_LAYER1,
        visibility: true,
        opacity: 0.7,
        attributions: "hello world (old)",
      } as MapContextLayer;
      updateLayerProperties(layerModel, olLayer, prevLayerModel);
      expect(olLayer.setVisible).not.toHaveBeenCalled();
      expect(olLayer.setOpacity).toHaveBeenCalledWith(0.9);
      expect(olSource.setAttributions).toHaveBeenCalledWith("hello world");
      expect(olLayer.set).toHaveBeenCalledWith("label", "Test Layer");
    });
  });
});
