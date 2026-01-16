import { describe } from "vitest";
import {
  addLayerToContext,
  changeLayerPositionInContext,
  getLayerPosition,
  removeLayerFromContext,
  replaceLayerInContext,
  updateLayerInContext,
} from "./map-context.js";
import { MapContext, MapContextLayer } from "../model/index.js";
import {
  SAMPLE_CONTEXT,
  SAMPLE_LAYER1,
  SAMPLE_LAYER2,
  SAMPLE_LAYER3,
} from "../../fixtures/map-context.fixtures.js";

describe("Map context utils", () => {
  describe("getLayerPosition", () => {
    it("returns the index of the layer in the context", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      expect(getLayerPosition(context, SAMPLE_LAYER1)).toBe(0);
      expect(getLayerPosition(context, SAMPLE_LAYER2)).toBe(1);
    });
  });
  describe("addLayerToContext", () => {
    it("adds a layer to the context", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1],
      };
      const newLayer = { ...SAMPLE_LAYER2, name: "newLayer" };
      const newContext = addLayerToContext(context, newLayer);
      expect(newContext.layers).toEqual([SAMPLE_LAYER1, newLayer]);
    });
    it("adds a layer at a specific position", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      const newLayer = { ...SAMPLE_LAYER2, name: "newLayer" };
      const newContext = addLayerToContext(context, newLayer, 1);
      expect(newContext.layers).toEqual([
        SAMPLE_LAYER1,
        newLayer,
        SAMPLE_LAYER2,
      ]);
    });
  });
  describe("removeLayerFromContext", () => {
    it("removes a layer from the context", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      const newContext = removeLayerFromContext(context, SAMPLE_LAYER1);
      expect(newContext.layers).toEqual([SAMPLE_LAYER2]);
    });
  });
  describe("replaceLayerInContext", () => {
    it("replaces a layer in the context", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      const replacementLayer = { ...SAMPLE_LAYER3 };
      const existingLayer = { ...SAMPLE_LAYER1 };
      const newContext = replaceLayerInContext(
        context,
        existingLayer,
        replacementLayer,
      );
      expect(newContext.layers).toEqual([replacementLayer, SAMPLE_LAYER2]);
    });
  });
  describe("changeLayerPositionInContext", () => {
    it("changes the position of a layer in the context", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      const newContext = changeLayerPositionInContext(
        context,
        SAMPLE_LAYER1,
        1,
      );
      expect(newContext.layers).toEqual([SAMPLE_LAYER2, SAMPLE_LAYER1]);
    });
  });

  describe("updateLayerInContext", () => {
    it("updates properties of a layer in the context (without id)", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      const newContext = updateLayerInContext(context, SAMPLE_LAYER1, {
        opacity: 0.8,
        visibility: false,
      });
      expect(newContext.layers).toHaveLength(2);
      expect(newContext.layers[0]).toEqual({
        ...SAMPLE_LAYER1,
        opacity: 0.8,
        visibility: false,
      });
      expect(newContext.layers[1]).toBe(SAMPLE_LAYER2);
    });
    it("does not modify the original context", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      const newContext = updateLayerInContext(context, SAMPLE_LAYER1, {
        opacity: 0.8,
        visibility: false,
      });
      expect(newContext).not.toBe(context);
      expect(newContext.layers).not.toBe(context.layers);
    });
    it("updates properties of a layer with id in the context", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [
          SAMPLE_LAYER1,
          SAMPLE_LAYER2,
          { ...SAMPLE_LAYER3, id: "myLayer", version: 3 },
        ],
      };
      const newContext = updateLayerInContext(
        context,
        // this is an empty layer that should not be used because we should track the layer by id in the context
        {
          id: "myLayer",
        } as MapContextLayer,
        {
          opacity: 0.8,
          visibility: false,
        },
      );
      expect(newContext.layers).toHaveLength(3);
      expect(newContext.layers[2]).toEqual({
        ...SAMPLE_LAYER3,
        id: "myLayer",
        version: 4,
        opacity: 0.8,
        visibility: false,
      });
      expect(newContext.layers[0]).toBe(SAMPLE_LAYER1);
      expect(newContext.layers[1]).toBe(SAMPLE_LAYER2);
    });
    it("changes the context ref even if the layer is not found (the layers array is untouched)", () => {
      const context: MapContext = {
        ...SAMPLE_CONTEXT,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER2],
      };
      const newContext = updateLayerInContext(context, SAMPLE_LAYER3, {
        opacity: 0.8,
      });
      expect(newContext).not.toBe(context);
      expect(newContext.layers).toBe(context.layers);
    });
  });
});
