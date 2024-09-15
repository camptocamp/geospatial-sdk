import {
  MapContext,
  MapContextDiff,
  MapContextLayer,
} from "@geospatial-sdk/core";
import {
  SAMPLE_CONTEXT,
  SAMPLE_LAYER1,
  SAMPLE_LAYER2,
  SAMPLE_LAYER3,
  SAMPLE_LAYER4,
  SAMPLE_LAYER5,
} from "@geospatial-sdk/core/fixtures/map-context.fixtures";
import Map from "ol/Map";
import { createLayer, createMapFromContext } from "./create-map";
import { applyContextDiffToMap } from "./apply-context-diff";
import { beforeEach } from "vitest";
import BaseLayer from "ol/layer/Base";

async function assertEqualsToModel(layer: any, layerModel: MapContextLayer) {
  const reference = (await createLayer(layerModel)) as any;
  expect(reference).toBeInstanceOf(layer.constructor);
  const refSource = reference.getSource() as any;
  const layerSource = layer.getSource() as any;
  expect(reference.getSource()).toBeInstanceOf(layer.getSource()?.constructor);
  if (typeof refSource?.getUrl === "function") {
    expect(layerSource?.getUrl).toBeTypeOf("function");
  } else if (typeof refSource?.getUrls !== "undefined") {
    expect(refSource?.getUrls()).toEqual(layerSource?.getUrls());
  } else if (typeof refSource?.getUrl !== "undefined") {
    expect(refSource?.getUrl()).toEqual(layerSource?.getUrl());
  }
}

describe("applyContextDiffToMap", () => {
  let context: MapContext;
  let diff: MapContextDiff;
  let map: Map;
  let layersArray: BaseLayer[];

  beforeEach(async () => {
    context = {
      ...SAMPLE_CONTEXT,
      layers: [SAMPLE_LAYER2, SAMPLE_LAYER1],
    };
    map = await createMapFromContext(context);
  });

  describe("no change", () => {
    beforeEach(async () => {
      diff = {
        layersAdded: [],
        layersChanged: [],
        layersRemoved: [],
        layersReordered: [],
      };
      await applyContextDiffToMap(map, diff);
      layersArray = map.getLayers().getArray();
    });
    it("does not affect the map", () => {
      expect(layersArray.length).toEqual(2);
      assertEqualsToModel(layersArray[0], SAMPLE_LAYER2);
      assertEqualsToModel(layersArray[1], SAMPLE_LAYER1);
    });
  });

  describe("layers added", () => {
    beforeEach(() => {
      diff = {
        layersAdded: [
          {
            layer: SAMPLE_LAYER3,
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
      };
      applyContextDiffToMap(map, diff);
      layersArray = map.getLayers().getArray();
    });
    it("adds the layers to the map", () => {
      expect(layersArray.length).toEqual(4);
      assertEqualsToModel(layersArray[0], SAMPLE_LAYER3);
      assertEqualsToModel(layersArray[1], SAMPLE_LAYER2);
      assertEqualsToModel(layersArray[2], SAMPLE_LAYER4);
      assertEqualsToModel(layersArray[3], SAMPLE_LAYER1);
    });
  });

  describe("layers removed", () => {
    beforeEach(() => {
      diff = {
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
      };
      applyContextDiffToMap(map, diff);
    });
    it("deletes the layers", () => {
      expect(map.getLayers().getLength()).toEqual(0);
    });
  });

  describe("layers changed", () => {
    beforeEach(() => {
      diff = {
        layersAdded: [],
        layersChanged: [
          {
            layer: {
              ...SAMPLE_LAYER2,
              url: "http://changed/",
            } as MapContextLayer,
            position: 0,
          },
          {
            layer: {
              ...SAMPLE_LAYER1,
              url: "http://changed/",
              extras: {
                changed: true,
              },
            } as MapContextLayer,
            position: 1,
          },
        ],
        layersRemoved: [],
        layersReordered: [],
      };
      applyContextDiffToMap(map, diff);
      layersArray = map.getLayers().getArray();
    });
    it("modifies the layers accordingly", () => {
      expect(layersArray.length).toEqual(2);
      assertEqualsToModel(layersArray[0], diff.layersChanged[0].layer);
      assertEqualsToModel(layersArray[1], diff.layersChanged[1].layer);
    });
  });

  describe("reordering", () => {
    describe("three layers reordered", () => {
      beforeEach(async () => {
        context = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER1, SAMPLE_LAYER2, SAMPLE_LAYER3],
        };
        map = await createMapFromContext(context);
        diff = {
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
        };
        applyContextDiffToMap(map, diff);
        layersArray = map.getLayers().getArray();
      });
      it("moves the layers accordingly", () => {
        expect(layersArray.length).toEqual(3);
        assertEqualsToModel(layersArray[0], SAMPLE_LAYER2);
        assertEqualsToModel(layersArray[1], SAMPLE_LAYER1);
        assertEqualsToModel(layersArray[2], SAMPLE_LAYER3);
      });
    });

    describe("four layers reordered", () => {
      beforeEach(async () => {
        context = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER1, SAMPLE_LAYER3, SAMPLE_LAYER4, SAMPLE_LAYER2],
        };
        map = await createMapFromContext(context);
        diff = {
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
        };
        applyContextDiffToMap(map, diff);
        layersArray = map.getLayers().getArray();
      });
      it("moves the layers accordingly", () => {
        expect(layersArray.length).toEqual(4);
        assertEqualsToModel(layersArray[0], SAMPLE_LAYER4);
        assertEqualsToModel(layersArray[1], SAMPLE_LAYER3);
        assertEqualsToModel(layersArray[2], SAMPLE_LAYER1);
        assertEqualsToModel(layersArray[3], SAMPLE_LAYER2);
      });
    });
  });

  describe("view change", () => {
    describe("set to default view", () => {
      beforeEach(async () => {
        context = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER1, SAMPLE_LAYER2, SAMPLE_LAYER3],
        };
        map = await createMapFromContext(context);
        diff = {
          layersAdded: [],
          layersChanged: [],
          layersRemoved: [],
          layersReordered: [],
          viewChanges: null,
        };
        applyContextDiffToMap(map, diff);
      });
      it("set the view back to default", () => {
        const view = map.getView();
        expect(view.getCenter()).toEqual([0, 0]);
        expect(view.getZoom()).toEqual(0);
      });
    });

    describe("four layers reordered", () => {
      beforeEach(async () => {
        context = {
          ...SAMPLE_CONTEXT,
          layers: [SAMPLE_LAYER1, SAMPLE_LAYER3, SAMPLE_LAYER4, SAMPLE_LAYER2],
        };
        map = await createMapFromContext(context);
        diff = {
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
        };
        applyContextDiffToMap(map, diff);
        layersArray = map.getLayers().getArray();
      });
      it("moves the layers accordingly", () => {
        expect(layersArray.length).toEqual(4);
        assertEqualsToModel(layersArray[0], SAMPLE_LAYER4);
        assertEqualsToModel(layersArray[1], SAMPLE_LAYER3);
        assertEqualsToModel(layersArray[2], SAMPLE_LAYER1);
        assertEqualsToModel(layersArray[3], SAMPLE_LAYER2);
      });
    });
  });

  describe("combined changes", () => {
    let changedLayer: MapContextLayer;
    beforeEach(async () => {
      changedLayer = { ...SAMPLE_LAYER3, extras: { prop: true } };
      context = {
        ...context,
        layers: [SAMPLE_LAYER1, SAMPLE_LAYER5, SAMPLE_LAYER3, SAMPLE_LAYER4],
      };
      map = await createMapFromContext(context);
      diff = {
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
      };
      applyContextDiffToMap(map, diff);
      layersArray = map.getLayers().getArray();
    });
    it("applies all changes", () => {
      expect(layersArray.length).toEqual(3);
      assertEqualsToModel(layersArray[0], SAMPLE_LAYER2);
      assertEqualsToModel(layersArray[1], changedLayer);
      assertEqualsToModel(layersArray[2], SAMPLE_LAYER5);
    });
  });
});
