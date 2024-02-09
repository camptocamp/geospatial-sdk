import { GeocodingResult } from "../model";
import { BBox, FeatureCollection, Geometry } from "geojson";

// from https://github.com/geoblocks/ga-search
const baseUrl = "https://api3.geo.admin.ch/rest/services/api/SearchServer";

export type GeoadminResponse = FeatureCollection;

/**
 * Reference documentation: https://api3.geo.admin.ch/services/sdiservices.html#search
 * @property type Default is 'locations'
 * @property sr Defaults to 4326
 * @property limit Default value is 50 for 'locations', 20 for 'featuresearch', 30 for 'layers'
 * @property lang Default is 'en'
 * @property origins Defaults to 'zipcode,gg25'; only applies when type is 'locations'
 * @property features A list of technical layer names; only applies when type is 'featuresearch'
 */
export interface GeoadminOptions {
  type?: "locations" | "featuresearch" | "layers";
  sr?: "21781" | "2056" | "4326" | "3857";
  origins?: Array<
    | "zipcode"
    | "gg25"
    | "district"
    | "kantone"
    | "gazetteer"
    | "address"
    | "parcel"
  >;
  limit?: number;
  lang?: "de" | "fr" | "it" | "rm" | "en";
  features?: string[];
}

export function queryGeoadmin(
  input: string,
  options?: GeoadminOptions,
): Promise<GeocodingResult[]> {
  const baseOptions: GeoadminOptions = {
    type: "locations",
    sr: "4326",
    origins: ["zipcode", "gg25"],
    lang: "en",
    features: [],
  };
  const finalOptions = options ? { ...baseOptions, ...options } : baseOptions;

  const url = new URL(baseUrl);
  url.searchParams.set("geometryFormat", "geojson");
  url.searchParams.set("type", finalOptions.type!);
  url.searchParams.set("searchText", input);
  url.searchParams.set("lang", finalOptions.lang!);
  url.searchParams.set("sr", finalOptions.sr!);
  if (finalOptions.limit !== undefined) {
    url.searchParams.set("limit", finalOptions.limit.toString());
  }

  switch (finalOptions.type!) {
    case "locations":
      url.searchParams.set("origins", finalOptions.origins!.join(","));
      break;
    case "featuresearch":
      url.searchParams.set("features", finalOptions.features!.join(","));
      break;
  }

  return fetch(url.toString())
    .then((response) => response.json())
    .then((response: GeoadminResponse) =>
      response.features.map((feature) => {
        const label = feature.properties?.label.replace(/<[^>]*>?/gm, "");
        const geom = feature.bbox ? bboxToGeometry(feature.bbox) : null;
        return {
          label,
          geom,
        };
      }),
    );
}

function bboxToGeometry(extent: BBox): Geometry {
  const [minX, minY, maxX, maxY] = extent;
  return {
    type: "Polygon",
    coordinates: [
      [
        [minX, minY],
        [minX, maxY],
        [maxX, maxY],
        [maxX, minY],
        [minX, minY],
      ],
    ],
  };
}
