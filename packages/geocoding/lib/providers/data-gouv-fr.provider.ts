import { GeocodingResult } from "../model/index.js";
import { Geometry } from "geojson";

interface DataGouvFrResponseItem {
  type: "Feature";
  geometry: Geometry;
  properties: {
    label: string;
    score: number;
    id: string;
    name: string;
    postcode: string;
    citycode: string;
    x: number;
    y: number;
    city: string;
    district?: string;
    context: string;
    type: string;
    importance: number;
    street: string;
    housenumber?: string;
  };
}

export interface DataGouvFrResponse {
  type: "FeatureCollection";
  version: string;
  features: Array<DataGouvFrResponseItem>;
  attribution: string;
  licence: string;
  query: string;
  filters?: Record<string, string>;
  limit: number;
}

const baseUrl = "https://api-adresse.data.gouv.fr/search/";

/**
 * Reference documentation: https://adresse.data.gouv.fr/api-doc/adresse
 * @property type
 * @property postCode
 * @property cityCode
 * @property limit Default value 15
 */
export interface DataGouvFrOptions {
  type?: "housenumber" | "street" | "locality" | "municipality";
  postCode?: string;
  cityCode?: string;
  limit?: number;
}

export function queryDataGouvFr(
  input: string,
  options?: DataGouvFrOptions,
): Promise<GeocodingResult[]> {
  const baseOptions: DataGouvFrOptions = {};
  const finalOptions = options ? { ...baseOptions, ...options } : baseOptions;

  const url = new URL(baseUrl);
  url.searchParams.set("q", input);
  if (finalOptions.limit) {
    url.searchParams.set("limit", finalOptions.limit.toString());
  }
  if (finalOptions.type) {
    url.searchParams.set("type", finalOptions.type);
  }
  if (finalOptions.postCode) {
    url.searchParams.set("postcode", finalOptions.postCode);
  }
  if (finalOptions.cityCode) {
    url.searchParams.set("citycode", finalOptions.cityCode);
  }
  return fetch(url.toString())
    .then((response) => response.json())
    .then((response: DataGouvFrResponse) =>
      response.features.map((feature) => {
        const label = feature.properties?.label.replace(/<[^>]*>?/gm, "");
        const geom = feature.geometry;
        return {
          label,
          geom,
        };
      }),
    );
}
