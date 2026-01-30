import {
  getFeaturesFromVectorSources,
  getFeaturesFromWmsSources,
  getGFIUrl,
} from "./get-features.js";
import OlMap from "ol/Map.js";
import TileWMS from "ol/source/TileWMS.js";
import TileLayer from "ol/layer/Tile.js";
import OlFeature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import View from "ol/View.js";
import { Collection, Object as BaseObject } from "ol";

const gfiResult = {
  type: "Feature",
  properties: {
    density: 123,
  },
  geometry: null,
};
function createWmsSource() {
  return new TileWMS({
    url: "http://my.service.org/wms?SERVICE=WMS",
    params: {
      LAYERS: "layerName",
      FORMAT: "image/png",
      TRANSPARENT: true,
    },
  });
}
function createMap(): OlMap {
  const wmsLayer = new TileLayer({
    source: createWmsSource(),
  });
  const feature = new OlFeature({
    geometry: new Point([100, 200]),
  });
  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      features: [feature],
    }),
  });
  const view = new View({
    projection: "EPSG:3857",
    resolution: 1,
    center: [0, 0],
  });
  const map = new BaseObject() as OlMap;
  Object.defineProperties(map, {
    getView: { value: vi.fn(() => view) },
    getLayers: { value: vi.fn(() => new Collection([wmsLayer, vectorLayer])) },
    getEventPixel: { value: vi.fn(() => [10, 10]) },
    getCoordinateFromPixel: { value: vi.fn(() => [123, 123]) },
    forEachFeatureAtPixel: {
      value: vi.fn((pixel, callback) => {
        callback(feature, vectorLayer);
      }),
    },
    getSize: { value: vi.fn(() => [800, 600]) },
  });
  return map;
}

describe("get features utils", () => {
  let map: OlMap;
  beforeEach(() => {
    map = createMap();
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ features: [gfiResult] }),
      } as Response),
    );
    vi.useFakeTimers();
  });

  describe("getFeaturesFromVectorSources", () => {
    it("returns an array of features", () => {
      const featuresByLayerIndex = getFeaturesFromVectorSources(map, [0, 0]);
      expect(featuresByLayerIndex).toEqual(
        new Map([
          [
            1,
            [
              {
                geometry: {
                  coordinates: [100, 200],
                  type: "Point",
                },
                properties: null,
                type: "Feature",
              },
            ],
          ],
        ]),
      );
    });
  });
  describe("getGFIUrl", () => {
    let url: string;
    const coordinate = [-182932.49329334166, 6125319.813853541];
    beforeEach(() => {
      const wmsSource = createWmsSource();
      url = getGFIUrl(wmsSource, map, coordinate) as string;
    });
    it("returns true", () => {
      expect(url).toEqual(
        "http://my.service.org/wms?SERVICE=WMS&REQUEST=GetFeatureInfo&QUERY_LAYERS=layerName&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=layerName&INFO_FORMAT=application%2Fjson&I=176&J=31&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX=-183143.11977128312%2C6125051.950547744%2C-182837.37165814242%2C6125357.698660884",
      );
    });
  });
  describe("getFeaturesFromWmsSources", () => {
    it("queries the WMS sources", async () => {
      const featuresByLayerIndex = await getFeaturesFromWmsSources(map, [0, 0]);
      expect(featuresByLayerIndex).toEqual(new Map([[0, [gfiResult]]]));
    });
  });
});
