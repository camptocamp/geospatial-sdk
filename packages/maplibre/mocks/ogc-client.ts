// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export class WmsEndpoint {
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
      getMapUrl: () => {
        return "https://www.datagrandest.fr/geoserver/region-grand-est/ows?REQUEST=GetMap&SERVICE=WMS&layers=commune_actuelle_3857&styles=&format=image%2Fpng&transparent=true&version=1.1.1&height=256&width=256&srs=EPSG%3A3857&bbox=0%2C0%2C0%2C0";
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
