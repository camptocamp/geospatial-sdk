// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import WMTSTileGrid from "ol/tilegrid/WMTS.js";

export class WmtsEndpoint {
  constructor(private url) {}
  isReady() {
    if (this.url.indexOf("error") > -1) {
      return Promise.reject(new Error("Something went wrong"));
    }
    return Promise.resolve({
      getLayerByName: (name) => {
        return {
          name,
          title: "SG00066",
          abstract: "",
          styles: [
            {
              title: "First Style",
              name: "first",
            },
            {
              title: "Default Style",
              name: "default",
            },
          ],
          resourceLinks: [
            {
              format: "image/jpgpng",
              url: "https://services.geo.sg.ch/wss/service/SG00066_WMTS/guest/tile/1.0.0/SG00066/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}",
              encoding: "REST",
            },
            {
              encoding: "KVP",
              url: "https://services.geo.sg.ch/wss/service/SG00066_WMTS/guest?",
              format: "image/jpgpng",
            },
          ],
          matrixSets: [
            {
              identifier: "default028mm",
              crs: "urn:ogc:def:crs:EPSG::2056",
              limits: [],
            },
          ],
          defaultStyle:
            this.url.indexOf("no-default-style") > -1 ? undefined : "default",
          latLonBoundingBox: [
            8.73730142520394, 46.847419134101315, 9.748085959426389,
            47.53980655003323,
          ],
          dimensions: [],
        };
      },
      getOpenLayersTileGrid() {
        return new WMTSTileGrid({
          extent: [
            8.73730142520394, 46.847419134101315, 9.748085959426389,
            47.53980655003323,
          ],
          origin: [8.73730142520394, 46.847419134101315],
          resolutions: [1000, 500, 250, 100, 50],
        });
      },
      getDefaultDimensions: () => {
        return [];
      },
      getSingleLayerName: () => {
        return null;
      },
    });
  }
}

export class WfsEndpoint {
  constructor(private url) {}

  isReady() {
    if (this.url.indexOf("error") > -1) {
      return Promise.reject(new Error("Something went wrong"));
    }
    return Promise.resolve({
      getLayerByName: (name) => {
        return {
          name,
          latLonBoundingBox: [1.33, 48.81, 4.3, 51.1],
        };
      },
      getSingleFeatureTypeName: () => {
        return "ms:commune_actuelle_3857";
      },
      getFeatureUrl: () => {
        return "https://www.datagrandest.fr/geoserver/region-grand-est/ows?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application%2Fjson&typename=ms%3Acommune_actuelle_3857&srsname=EPSG%3A3857&bbox=10%2C20%2C30%2C40%2CEPSG%3A3857&maxFeatures=10000";
      },
    });
  }
}

export class OgcApiEndpoint {
  constructor(private url: string) {
    // newEndpointCall(url) // to track endpoint creation
  }
  getCollectionInfo() {
    if (this.url.indexOf("error.http") > -1) {
      return Promise.reject({
        type: "http",
        info: "Something went wrong",
        httpStatus: 403,
      });
    }
    return Promise.resolve({
      bulkDownloadLinks: { json: "http://json", csv: "http://csv" },
    });
  }
  allCollections = Promise.resolve([{ name: "collection1" }]);
  featureCollections =
    this.url.indexOf("error.http") > -1
      ? Promise.reject(new Error())
      : Promise.resolve(["collection1", "collection2"]);
  getCollectionItem(collection, id) {
    return Promise.resolve("item1");
  }
  getCollectionItemsUrl(collection) {
    return "https://demo.ldproxy.net/zoomstack/collections/airports/items?f=json";
  }
}
