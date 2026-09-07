import {
  canDoIncrementalUpdate,
  updateLayerProperties,
} from "./layer-update.js";
import { MapContextLayer } from "@geospatial-sdk/core";
import Layer from "ol/layer/Layer.js";
import {
  SAMPLE_LAYER1,
  SAMPLE_LAYER3,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures.js";
import VectorLayer from "ol/layer/Vector.js";
import TileLayer from "ol/layer/Tile.js";
import TileWMS from "ol/source/TileWMS.js";

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
    let olSource: TileWMS;

    beforeEach(() => {
      // SAMPLE_LAYER1 is a WMS model, so its source must be a WMS source
      olSource = new TileWMS({ url: "http://abc.org/wms", params: {} });
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

    it("updates WMS style via source updateParams", () => {
      const wmsSource = new TileWMS({
        url: "https://example.com/wms",
        params: { LAYERS: "myLayer", STYLES: "default" },
      });
      const wmsLayer = new TileLayer({ source: wmsSource });
      vi.spyOn(wmsSource, "updateParams");

      const layerModel = {
        ...SAMPLE_LAYER1,
        style: "newStyle",
      } as MapContextLayer;
      const prevLayerModel = { ...SAMPLE_LAYER1 } as MapContextLayer;
      updateLayerProperties(layerModel, wmsLayer, prevLayerModel);
      expect(wmsSource.updateParams).toHaveBeenCalledWith({
        LAYERS: "myLayer",
        STYLES: "newStyle",
      });
    });

    it("enable interaction-related props without recreating them", async () => {
      // mocking a vector layer
      (olLayer as VectorLayer).setStyle = vi.fn();

      const layerModel = {
        ...SAMPLE_LAYER3,
        style: {
          "circle-fill-color": "blue",
        },
        hoverable: true,
        clickable: false,
      };
      const prevLayerModel = SAMPLE_LAYER3;
      updateLayerProperties(layerModel, olLayer, prevLayerModel);
      expect((olLayer as VectorLayer).setStyle).toHaveBeenCalledWith(
        layerModel.style,
      );
      expect(olLayer.set).toHaveBeenCalledWith(
        "--geospatial-sdk-hoverable",
        true,
      );
      expect(olLayer.set).toHaveBeenCalledWith(
        "--geospatial-sdk-clickable",
        false,
      );
    });
  });
});
