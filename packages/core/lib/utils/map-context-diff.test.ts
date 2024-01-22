import { MapContext, MapContextDiff, MapContextLayer } from "../model";
import { deepFreeze } from "./freeze";
import {
  computeMapContextDiff,
  getLayerHash,
  isLayerSame,
  isLayerSameAndUnchanged,
} from "./map-context-diff";

const SAMPLE_CONTEXT: MapContext = deepFreeze({
  view: {
    center: [10, 20],
    zoom: 3,
    extent: [40, 50, 60, 70],
  },
  layers: [],
});

const SAMPLE_LAYER1: MapContextLayer = deepFreeze({
  type: "wms",
  url: "http://abc.org/wms",
  name: "myLayer",
  extras: { myField: "abc" },
});
const SAMPLE_LAYER2: MapContextLayer = deepFreeze({
  type: "xyz",
  url: "http://abc.org/tiles",
  extras: { myField2: "123" },
});
const SAMPLE_LAYER3: MapContextLayer = deepFreeze({
  type: "geojson",
  data: '{ "type": "Feature", "properties": {}}',
  extras: { myField3: "000" },
});
const SAMPLE_LAYER4: MapContextLayer = deepFreeze({
  type: "wfs",
  url: "http://abc.org/wfs",
  featureType: "myFeatureType",
  extras: { myField4: "aaa" },
});
const SAMPLE_LAYER5: MapContextLayer = deepFreeze({
  type: "xyz",
  url: "http://my.tiles/server",
});

describe("Context diff utils", () => {
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

  describe("computeMapContextDiff", () => {
    let contextOld: MapContext;
    let contextNew: MapContext;
    let diff: MapContextDiff;

    describe("no change", () => {
      beforeEach(() => {
        contextOld = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER2, SAMPLE_LAYER1],
        };
        contextNew = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER2, SAMPLE_LAYER1],
        };
      });
      it("outputs the correct diff", () => {
        diff = computeMapContextDiff(contextNew, contextOld);
        expect(diff).toEqual({
          layersAdded: [],
          layersChanged: [],
          layersRemoved: [],
          layersReordered: [],
          viewChanges: {},
        });
      });
    });

    describe("layers added", () => {
      beforeEach(() => {
        contextOld = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER1],
        };
        contextNew = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER2, SAMPLE_LAYER1, SAMPLE_LAYER4],
        };
      });
      it("outputs the correct diff", () => {
        diff = computeMapContextDiff(contextNew, contextOld);
        expect(diff).toEqual({
          layersAdded: [
            {
              layer: SAMPLE_LAYER2,
              position: 0,
            },
            {
              layer: SAMPLE_LAYER4,
              position: 2,
            },
          ],
          layersChanged: [],
          layersRemoved: [],
          layersReordered: [],
          viewChanges: {},
        });
      });
    });

    describe("layers removed", () => {
      beforeEach(() => {
        contextOld = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER2, SAMPLE_LAYER1, SAMPLE_LAYER4],
        };
        contextNew = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER4],
        };
      });
      it("outputs the correct diff", () => {
        diff = computeMapContextDiff(contextNew, contextOld);
        expect(diff).toEqual({
          layersAdded: [],
          layersChanged: [],
          layersRemoved: [
            {
              layer: SAMPLE_LAYER2,
              position: 0,
            },
            {
              layer: SAMPLE_LAYER1,
              position: 1,
            },
          ],
          layersReordered: [],
          viewChanges: {},
        });
      });
    });

    describe("layers changed", () => {
      beforeEach(() => {
        contextOld = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER2, { ...SAMPLE_LAYER1, id: 123, version: 3 }],
        };
        contextNew = {
          ...SAMPLE_CONTEXT,
          layers: [
            { ...SAMPLE_LAYER2, extras: { prop: true } },
            { ...SAMPLE_LAYER1, id: 123, version: 10 },
          ],
        };
      });
      it("outputs the correct diff", () => {
        diff = computeMapContextDiff(contextNew, contextOld);
        expect(diff).toEqual({
          layersAdded: [],
          layersChanged: [
            {
              layer: contextNew.layers[0],
              position: 0,
            },
            {
              layer: contextNew.layers[1],
              position: 1,
            },
          ],
          layersRemoved: [],
          layersReordered: [],
          viewChanges: {},
        });
      });
    });

    describe("reordering", () => {
      describe("three layers reordered", () => {
        beforeEach(() => {
          contextOld = {
            ...SAMPLE_CONTEXT,
            layers: [SAMPLE_LAYER1, SAMPLE_LAYER2, SAMPLE_LAYER3],
          };
          contextNew = {
            ...SAMPLE_CONTEXT,
            layers: [SAMPLE_LAYER2, SAMPLE_LAYER1, SAMPLE_LAYER3],
          };
        });
        it("outputs the correct diff", () => {
          diff = computeMapContextDiff(contextNew, contextOld);
          expect(diff).toEqual({
            layersAdded: [],
            layersChanged: [],
            layersRemoved: [],
            layersReordered: [
              {
                layer: SAMPLE_LAYER2,
                newPosition: 0,
                previousPosition: 1,
              },
              {
                layer: SAMPLE_LAYER1,
                newPosition: 1,
                previousPosition: 0,
              },
            ],
            viewChanges: {},
          });
        });
      });

      describe("four layers reordered", () => {
        beforeEach(() => {
          contextOld = {
            ...SAMPLE_CONTEXT,
            layers: [
              SAMPLE_LAYER1,
              SAMPLE_LAYER3,
              SAMPLE_LAYER4,
              SAMPLE_LAYER2,
            ],
          };
          contextNew = {
            ...SAMPLE_CONTEXT,
            layers: [
              SAMPLE_LAYER4,
              SAMPLE_LAYER3,
              SAMPLE_LAYER1,
              SAMPLE_LAYER2,
            ],
          };
        });
        it("outputs the correct diff", () => {
          diff = computeMapContextDiff(contextNew, contextOld);
          expect(diff).toEqual({
            layersAdded: [],
            layersChanged: [],
            layersRemoved: [],
            layersReordered: [
              {
                layer: SAMPLE_LAYER4,
                newPosition: 0,
                previousPosition: 2,
              },
              {
                layer: SAMPLE_LAYER1,
                newPosition: 2,
                previousPosition: 0,
              },
            ],
            viewChanges: {},
          });
        });
      });
    });

    describe("combined changes", () => {
      let changedLayer: MapContextLayer;
      beforeEach(() => {
        changedLayer = { ...SAMPLE_LAYER3, extras: { prop: true } };
        contextOld = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER1, SAMPLE_LAYER5, SAMPLE_LAYER3, SAMPLE_LAYER4],
        };
        contextNew = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER2, changedLayer, SAMPLE_LAYER5],
        };
      });
      it("outputs the correct diff", () => {
        diff = computeMapContextDiff(contextNew, contextOld);
        expect(diff).toEqual({
          layersAdded: [
            {
              layer: SAMPLE_LAYER2,
              position: 0,
            },
          ],
          layersChanged: [
            {
              layer: changedLayer,
              position: 1,
            },
          ],
          layersRemoved: [
            {
              layer: SAMPLE_LAYER1,
              position: 0,
            },
            {
              layer: SAMPLE_LAYER4,
              position: 3,
            },
          ],
          layersReordered: [
            {
              layer: changedLayer,
              newPosition: 1,
              previousPosition: 2,
            },
            {
              layer: SAMPLE_LAYER5,
              newPosition: 2,
              previousPosition: 1,
            },
          ],
          viewChanges: {},
        });
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
});
