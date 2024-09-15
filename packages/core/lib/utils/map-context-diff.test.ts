import { MapContext, MapContextDiff, MapContextLayer } from "../model";
import { computeMapContextDiff } from "./map-context-diff";
import {
  SAMPLE_CONTEXT,
  SAMPLE_LAYER1,
  SAMPLE_LAYER2,
  SAMPLE_LAYER3,
  SAMPLE_LAYER4,
  SAMPLE_LAYER5,
} from "../../fixtures/map-context.fixtures";
import { describe } from "vitest";

describe("Context diff utils", () => {
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
          });
        });
      });
    });

    describe("view changes", () => {
      describe("both values", () => {
        beforeEach(() => {
          contextOld = {
            ...SAMPLE_CONTEXT,
            view: {
              center: [0, 0],
              zoom: 1,
            },
          };
          contextNew = {
            ...SAMPLE_CONTEXT,
            view: {
              center: [1, 1],
              zoom: 2,
            },
          };
        });
        it("outputs the correct diff", () => {
          diff = computeMapContextDiff(contextNew, contextOld);
          expect(diff).toEqual({
            layersAdded: [],
            layersChanged: [],
            layersRemoved: [],
            layersReordered: [],
            viewChanges: { ...contextNew.view },
          });
          expect(diff.viewChanges).not.toBe(contextNew.view); // the object reference should be different
        });
      });
      describe("value to null", () => {
        beforeEach(() => {
          contextOld = {
            ...SAMPLE_CONTEXT,
            view: {
              center: [0, 0],
              zoom: 1,
            },
          };
          contextNew = {
            ...SAMPLE_CONTEXT,
            view: null,
          };
        });
        it("outputs the correct diff", () => {
          diff = computeMapContextDiff(contextNew, contextOld);
          expect(diff).toEqual({
            layersAdded: [],
            layersChanged: [],
            layersRemoved: [],
            layersReordered: [],
            viewChanges: null,
          });
        });
      });
      describe("null to value", () => {
        beforeEach(() => {
          contextOld = {
            ...SAMPLE_CONTEXT,
            view: null,
          };
          contextNew = {
            ...SAMPLE_CONTEXT,
            view: {
              center: [0, 0],
              zoom: 1,
            },
          };
        });
        it("outputs the correct diff", () => {
          diff = computeMapContextDiff(contextNew, contextOld);
          expect(diff).toEqual({
            layersAdded: [],
            layersChanged: [],
            layersRemoved: [],
            layersReordered: [],
            viewChanges: {
              center: [0, 0],
              zoom: 1,
            },
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
          view: {
            extent: [0, 1, 2, 3],
          },
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
          viewChanges: {
            extent: [0, 1, 2, 3],
          },
        });
      });
    });
  });
});
