import { describe } from "vitest";
import {
  getLayerHash,
  isLayerSame,
  isLayerSameAndUnchanged,
  updateLayer,
} from "./map-context-layer.js";
import {
  SAMPLE_LAYER1,
  SAMPLE_LAYER2,
} from "../../fixtures/map-context.fixtures.js";

describe("Map context layer utils", () => {
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
    describe("layers with id and version", () => {
      it("compares non-strictly by id and version field", () => {
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
    describe("layers with id and both without version", () => {
      it("compares by properties, including extras", () => {
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
        ).toBe(false);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER1, id: "a" },
            { ...SAMPLE_LAYER1, id: "a" },
          ),
        ).toBe(true);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER2, id: "b", extras: { hello: "world" } },
            { ...SAMPLE_LAYER2, id: "b", extras: { hello: "world" } },
          ),
        ).toBe(true);
        expect(
          isLayerSameAndUnchanged(
            { ...SAMPLE_LAYER2, id: "b", extras: { hello: "world" } },
            { ...SAMPLE_LAYER2, id: "b", extras: { foo: "bar" } },
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

  describe("updateLayer", () => {
    it("applies updates to a layer", () => {
      const updated = updateLayer(SAMPLE_LAYER1, {
        opacity: 0.9,
        visibility: false,
      });
      expect(updated).toMatchObject({
        ...SAMPLE_LAYER1,
        opacity: 0.9,
        visibility: false,
      });
    });

    it("does not modify the original layer", () => {
      const updated = updateLayer(SAMPLE_LAYER1, { opacity: 0.5 });
      expect(updated).not.toBe(SAMPLE_LAYER1);
    });

    it("removes properties set to undefined", () => {
      const layerWithOpacity = { ...SAMPLE_LAYER1, opacity: 0.8 };
      const updated = updateLayer(layerWithOpacity, { opacity: undefined });
      expect(updated).not.toHaveProperty("opacity");
    });

    it("increments version when layer has both id and version", () => {
      const layer = { ...SAMPLE_LAYER1, id: "123", version: 0 };
      const updated = updateLayer(layer, { opacity: 0.6 });
      expect(updated.version).toBe(1);
    });

    it("does not write version when layer only has id", () => {
      const layer = { ...SAMPLE_LAYER1, id: "123" };
      const updated = updateLayer(layer, { opacity: 0.6 });
      expect(updated).not.toHaveProperty("version");
    });

    it("does not change the version if it is explicitly specified in the partial changes", () => {
      const layer = { ...SAMPLE_LAYER1, id: "123", version: 3 };
      const updated = updateLayer(layer, { opacity: 0.6, version: 12 });
      expect(updated.version).toBe(12);
    });
  });
});
