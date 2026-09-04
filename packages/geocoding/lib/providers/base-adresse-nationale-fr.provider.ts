import { GeocodingResult } from "../model/index.js";
import { Geometry } from "geojson";

// OpenAPI spec: https://data.geopf.fr/geocodage/openapi.yaml
// Each feature's properties carry a "_type" discriminator (poi/address/parcel)
// with a different shape per index; only a subset of each shape is typed here.
interface ResponseItem {
  type: "Feature";
  geometry: Geometry;
}

interface PoiResponseItem extends ResponseItem {
  properties: {
    _type: "poi";
    toponym: string;
    category?: string[];
    citycode?: string[];
    // the OpenAPI spec types this as a nested Geometry object, but the API
    // actually returns it JSON-encoded as a string
    truegeometry?: string;
  };
}

interface AddressResponseItem extends ResponseItem {
  properties: {
    _type: "address";
    label: string;
    postcode?: string;
    citycode?: string;
    city?: string;
    street?: string;
    housenumber?: string;
  };
}

interface ParcelResponseItem extends ResponseItem {
  properties: {
    _type: "parcel";
    section?: string;
    number?: string;
    city?: string;
    // unlike the poi index, this one is returned as a nested object, matching the OpenAPI spec
    truegeometry?: Geometry;
  };
}

type DataGeopfFrResponseItem =
  | PoiResponseItem
  | AddressResponseItem
  | ParcelResponseItem;

interface DataGeopfFrResponse {
  type: "FeatureCollection";
  features: DataGeopfFrResponseItem[];
  query: string;
}

const baseUrl = "https://data.geopf.fr/geocodage/search";

function parseFeature(feature: DataGeopfFrResponseItem): GeocodingResult {
  switch (feature.properties._type) {
    case "poi": {
      const { toponym, ...properties } = feature.properties;
      return { label: toponym, properties, geom: feature.geometry };
    }
    case "address": {
      const { label, ...properties } = feature.properties;
      return { label, properties, geom: feature.geometry };
    }
    case "parcel": {
      const { section, number, city } = feature.properties;
      return {
        label: `${section} ${number}, ${city}`,
        properties: feature.properties,
        geom: feature.geometry,
      };
    }
    default:
      throw new Error(
        `Unhandled feature type: ${(feature.properties as { _type: string })._type}`,
      );
  }
}

/**
 * Reference documentation: https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/
 * @property {("poi" | "address" | "parcel")[]} [index] Indexes to search; the service defaults to "address" when omitted
 * @property {string[]} [postCode] Filter by postal code(s); applies to the poi/address indexes
 * @property {string[]} [cityCode] Filter by INSEE city code(s); applies to the poi/address indexes
 * @property {string[]} [depCode] Filter by department code(s); applies to the poi/address indexes
 * @property {number} [limit] Maximum number of results
 * @property {string[]} [category] Poi category filter (up to 10 values); applies to the poi index only; searches all categories when omitted; see https://data.geopf.fr/geocodage/getCapabilities for the full list of values
 * @property {("housenumber" | "street" | "locality" | "municipality")[]} [type] Address result type filter; applies to the address index only
 * @property {boolean} [returnTrueGeometry=false] Include the true feature geometry in `properties.truegeometry`; `geom` always stays the service's own (simplified) geometry. Has no effect on the address index (no true geometry available)
 */
export interface BaseAdresseNationaleOptions {
  index?: ("poi" | "address" | "parcel")[];
  postCode?: string[];
  cityCode?: string[];
  depCode?: string[];
  limit?: number;
  category?: string[];
  type?: ("housenumber" | "street" | "locality" | "municipality")[];
  returnTrueGeometry?: boolean;
}

export function queryBaseAdresseNationale(
  input: string,
  options?: BaseAdresseNationaleOptions,
): Promise<GeocodingResult[]> {
  const finalOptions = options ?? {};

  const url = new URL(baseUrl);
  url.searchParams.set("q", input);
  url.searchParams.set("autocomplete", "1");
  if (finalOptions.index) {
    url.searchParams.set("index", finalOptions.index.join(","));
  }
  if (finalOptions.returnTrueGeometry) {
    url.searchParams.set("returntruegeometry", "true");
  }
  if (finalOptions.category) {
    url.searchParams.set("category", finalOptions.category.join(","));
  }
  if (finalOptions.type) {
    url.searchParams.set("type", finalOptions.type.join(","));
  }
  if (finalOptions.limit) {
    url.searchParams.set("limit", finalOptions.limit.toString());
  }
  if (finalOptions.postCode) {
    url.searchParams.set("postcode", finalOptions.postCode.join(","));
  }
  if (finalOptions.cityCode) {
    url.searchParams.set("citycode", finalOptions.cityCode.join(","));
  }
  if (finalOptions.depCode) {
    url.searchParams.set("depcode", finalOptions.depCode.join(","));
  }
  return fetch(url.toString())
    .then((response) => response.json())
    .then((response: DataGeopfFrResponse) =>
      response.features.map(parseFeature),
    );
}
