export class WmtsEndpoint {
  constructor(private url) {}
  isReady() {
    return Promise.resolve({
      getLayerByName: (name) => {
        if (this.url.indexOf("error") > -1) {
          throw new Error("Something went wrong");
        }
        return {
          name,
          latLonBoundingBox: [1.33, 48.81, 4.3, 51.1],
        };
      },
    });
  }
}

export class WfsEndpoint {
  constructor(private url) {}

  isReady() {
    return Promise.resolve({
      getLayerByName: (name) => {
        if (this.url.indexOf("error") > -1) {
          throw new Error("Something went wrong");
        }
        return {
          name,
          latLonBoundingBox: [1.33, 48.81, 4.3, 51.1],
        };
      },
      getSingleFeatureTypeName: () => {
        return "ms:commune_actuelle_3857";
      },
      getFeatureUrl: () => {
        return "https://www.geograndest.fr/geoserver/region-grand-est/ows?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application%2Fjson&typename=ms%3Acommune_actuelle_3857&srsname=EPSG%3A3857&bbox=10%2C20%2C30%2C40%2CEPSG%3A3857&maxFeatures=10000";
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
