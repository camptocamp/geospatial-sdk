import { MAP_CTX_LAYER_WMS_FIXTURE } from "@geospatial-sdk/core/fixtures/map-context.fixtures";
import { MapContextLayer } from "@geospatial-sdk/core";
import { StyleSpecification } from "maplibre-gl";
import { createLayer } from "./create-map";
import { RasterLayerSpecification } from "@maplibre/maplibre-gl-style-spec";

describe("MapContextService", () => {
  describe("#createLayer", () => {
    let layerModel: MapContextLayer, style: StyleSpecification;

    describe("WMS", () => {
      beforeEach(async () => {
        (layerModel = MAP_CTX_LAYER_WMS_FIXTURE),
          (style = await createLayer(layerModel));
      });
      it("create a tile layer", () => {
        expect(style).toBeTruthy();
      });
      it("create a source", () => {
        const sourcesIds = Object.keys(style.sources);
        expect(sourcesIds.length).toBe(1);
        expect(sourcesIds[0]).toBe("source-commune_actuelle_3857");
      });
      it("create a layer", () => {
        expect(style.layers).toBeTruthy();
        expect(style.layers.length).toBe(1);

        const layer = style.layers[0] as RasterLayerSpecification;
        expect(layer.id).toBe("layer-commune_actuelle_3857");
        expect(layer.source).toBe("source-commune_actuelle_3857");
        expect(layer.type).toBe(`raster`);
      });
    });
  });
});
