import { describe } from "vitest";
import {
  addLayerToContext,
  changeLayerPositionInContext,
  getLayerHash,
  getLayerPosition,
  isLayerSame,
  isLayerSameAndUnchanged,
  removeLayerFromContext,
  replaceLayerInContext,
} from "./map-context.js";
import { MapContext } from "../model/index.js";
import {
  SAMPLE_CONTEXT,
  SAMPLE_LAYER1,
  SAMPLE_LAYER2,
  SAMPLE_LAYER3,
} from "../../fixtures/map-context.fixtures.js";

describe("Map context utils", () => {
  describe("isLayerSame", () => {
    describe("layers with id", () => {
      it("compares non-strictly by id", () => {
        expect(
          isLayerSame(
            { ...SAMPLE_LAYER1, id: "a" },
            { ...SAMPLE_LAYER1, id: "b" },
          ),
        ).toBe(false);
        expect(
          isLayerSame(
            { ...SAMPLE_LAYER1, id: "ab" },
            { ...SAMPLE_LAYER2, id: "ab" },
          ),
        ).toBe(true);
        expect(
          isLayerSame(
            { ...SAMPLE_LAYER1, id: 1 },
            { ...SAMPLE_LAYER2, id: "01" },
          ),
        ).toBe(true);
        expect(
          isLayerSame({ ...SAMPLE_LAYER1, id: 1 }, { ...SAMPLE_LAYER2, id: 1 }),
        ).toBe(true);
        expect(
          isLayerSame({ ...SAMPLE_LAYER1, id: 1 }, { ...SAMPLE_LAYER1, id: 2 }),
        ).toBe(false);
      });
    });
    describe("layers without id", () => {
      it("compares by properties", () => {
        expect(isLayerSame(SAMPLE_LAYER1, SAMPLE_LAYER1)).toBe(true);
        expect(
          isLayerSame(SAMPLE_LAYER1, { ...SAMPLE_LAYER1, name: "abc" }),
        ).toBe(false);
        expect(
          isLayerSame(
            {
              ...SAMPLE_LAYER1,
              url: "http://abc.org",
              name: SAMPLE_LAYER1.name,
            },
            { ...SAMPLE_LAYER1, url: "http://abc.org" },
          ),
        ).toBe(true);
        expect(isLayerSame(SAMPLE_LAYER1, SAMPLE_LAYER2)).toBe(false);
      });
      it("ignores extras prop", () => {
        expect(
          isLayerSame(SAMPLE_LAYER1, {
            ...SAMPLE_LAYER1,
            extras: { otherProp: "abc" },
          }),
        ).toBe(true);
        expect(
          isLayerSame(SAMPLE_LAYER1, {
            ...SAMPLE_LAYER1,
            extras: undefined,
          }),
        ).toBe(true);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { extras, ...layer } = SAMPLE_LAYER1;
        expect(isLayerSame(SAMPLE_LAYER1, layer)).toBe(true);
      });
    });
    describe("layers with and without id", () => {
      it("compares by properties", () => {
        expect(
          isLayerSame(SAMPLE_LAYER1, { ...SAMPLE_LAYER1, id: "123" }),
        ).toBe(false);
        expect(
          isLayerSame(
            { ...SAMPLE_LAYER1, id: "123" },
            { id: "123", ...SAMPLE_LAYER1, name: SAMPLE_LAYER1.name },
          ),
        ).toBe(true);
      });
    });
  });

  describe("isLayerSameAndUnchanged", () => {
    describe("layers with id", () => {
      it("compares non-strictly by id and version field", () => {
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER1, id: "a" },
            { ...SAMPLE_LAYER1, id: "b" },
          ),
        ).toBe(false);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER1, id: "a" },
            { ...SAMPLE_LAYER2, id: "a" },
          ),
        ).toBe(true);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER1, id: "ab", version: 2 },
            { ...SAMPLE_LAYER2, id: "ab", version: 2 },
          ),
        ).toBe(true);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER1, id: "ab", version: 2 },
            { ...SAMPLE_LAYER1, id: "ab", version: 1 },
          ),
        ).toBe(false);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER1, id: 1 },
            { ...SAMPLE_LAYER1, id: "01", version: 3 },
          ),
        ).toBe(false);
      });
    });
    describe("layers without id", () => {
      it("compares by properties, including extras", () => {
        expect(isLayerSameAndUnchanged(SAMPLE_LAYER1, SAMPLE_LAYER1)).toBe(
          true,
        );
        expect(
          isLayerSameAndUnchanged(SAMPLE_LAYER1, {
            ...SAMPLE_LAYER1,
            name: "abc",
          }),
        ).toBe(false);
        expect(
          isLayerSameAndUnchanged(
            {
              ...SAMPLE_LAYER1,
              url: "http://abc.org",
              name: SAMPLE_LAYER1.name,
            },
            { ...SAMPLE_LAYER1, url: "http://abc.org" },
          ),
        ).toBe(true);
        expect(
          isLayerSameAndUnchanged(
            {
              ...SAMPLE_LAYER1,
              opacity: 1,
            },
            SAMPLE_LAYER1,
          ),
        ).toBe(false);
        expect(isLayerSameAndUnchanged(SAMPLE_LAYER1, SAMPLE_LAYER2)).toBe(
          false,
        );
      });
      it("takes into account extras prop", () => {
        expect(
          isLayerSameAndUnchanged(SAMPLE_LAYER1, {
            ...SAMPLE_LAYER1,
            extras: { otherProp: "abc" },
          }),
        ).toBe(false);
        expect(
          isLayerSameAndUnchanged(SAMPLE_LAYER1, {
            ...SAMPLE_LAYER1,
            extras: undefined,
          }),
        ).toBe(false);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { extras, ...layer } = SAMPLE_LAYER1;
        expect(isLayerSameAndUnchanged(SAMPLE_LAYER1, layer)).toBe(false);
      });
    });
    describe("layers with and without id", () => {
      it("compares by properties", () => {
        expect(
          isLayerSameAndUnchanged(SAMPLE_LAYER1, {
            ...SAMPLE_LAYER1,
            id: "123",
          }),
        ).toBe(false);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER1, id: "123" },
            { id: "123", ...SAMPLE_LAYER1, name: SAMPLE_LAYER1.name },
          ),
        ).toBe(true);
      });
    });
  });

  describe("getLayerHash", () => {
    it("works with serializable entities", () => {
      expect(
        getLayerHash({
          ...SAMPLE_LAYER1,
          extras: {
            array: [11, 22, null, undefined],
            object: {},
            undef: undefined,
          },
        }),
      ).toBeTypeOf("string");
    });
    it("ignores extra property by default", () => {
      expect(
        getLayerHash({
          ...SAMPLE_LAYER1,
          extras: {
            array: [11, 22, null, undefined],
            object: {},
          },
        }),
      ).toEqual(
        getLayerHash({
          ...SAMPLE_LAYER1,
          extras: { hello: "world" },
        }),
      );
    });
    it("works with non-serializable entities (but they are ignored)", () => {
      const hash = getLayerHash(
        {
          ...SAMPLE_LAYER1,
          extras: {
            func: () => 123,
            canvas: document.createElement("canvas"),
          },
        },
        true,
      );
      expect(hash).toBeTypeOf("string");
      expect(hash).toEqual(
        getLayerHash(
          {
            ...SAMPLE_LAYER1,
            extras: {
              func: () => 456,
              canvas: document.createElement("div"),
            },
          },
          true,
        ),
      );
      expect(hash).not.toEqual(
        getLayerHash(
          {
            ...SAMPLE_LAYER1,
            extras: {},
          },
          true,
        ),
      );
    });
    it("does not take into account properties order", () => {
      expect(
        getLayerHash(
          {
            type: "wms",
            url: "http://abc.org/wms",
            name: "myLayer",
            extras: {
              array: [1, 2, 3],
              object: {},
            },
          },
          true,
        ),
      ).toEqual(
        getLayerHash(
          {
            extras: {
              array: [1, 2, 3],
              object: {},
            },
            url: "http://abc.org/wms",
            type: "wms",
            name: "myLayer",
          },
          true,
        ),
      );
    });
  });

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
});
