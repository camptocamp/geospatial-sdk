import { GeocodingResult } from "../model/index.js";
import { Geometry } from "geojson";
const baseUrl =
  "https://www.marineregions.org/rest/getGazetteerRecordsByName.json";

/**
 * Reference documentation: https://www.marineregions.org/gazetteer.php?p=webservices&type=rest#/getGazetteerRecordsByName
 * @property like Match names containing the input instead of the exact name. Default is true
 * @property fuzzy Tolerate spelling mistakes (Levenshtein distance). Default is false
 * @property typeID One or more place type IDs, e.g. 70 for EEZ. The list of IDs is available at https://www.marineregions.org/rest/getGazetteerTypes.json. Default is all types
 * @property language Only return names recorded in this language (ISO 639-1 code, e.g. "fr"). Default is all languages
 * @property offset Index of the first record to return, used for paging. Default is 0
 * @property count Number of records to return. Default is 100, which is also the maximum
 */

export interface MarineRegionsOptions {
  like?: boolean;
  fuzzy?: boolean;
  typeID?: number | number[];
  language?: string;
  offset?: number;
  count?: number;
}

//what gazeeter sent to us
interface MarineRegionsRecord {
  MRGID: number;
  gazetteerSource: string | null;
  placeType: string;
  latitude: number | null;
  longitude: number | null;
  minLatitude: number | null;
  minLongitude: number | null;
  maxLatitude: number | null;
  maxLongitude: number | null;
  precision: number | null;
  preferredGazetteerName: string;
  preferredGazetteerNameLang: string;
  status: string;
  accepted: number;
}

//buildUrl("hawa", { count: 20, typeID: [20, 22] }) =
//https://www.marineregions.org/rest/getGazetteerRecordsByName.json/hawa/?typeID=20%2C22&count=20

function buildUrl(name: string, options: MarineRegionsOptions): string {
  const url = new URL(`${baseUrl}/${encodeURIComponent(name)}/`);
  if (options.like !== undefined) {
    url.searchParams.set("like", String(options.like));
  }
  if (options.fuzzy !== undefined) {
    url.searchParams.set("fuzzy", String(options.fuzzy));
  }
  if (options.typeID !== undefined) {
    const typeIDs = Array.isArray(options.typeID)
      ? options.typeID
      : [options.typeID];
    if (typeIDs.length > 0) {
      url.searchParams.set("typeID", typeIDs.join(","));
    }
  }
  if (options.language) {
    url.searchParams.set("language", options.language);
  }
  if (options.offset !== undefined) {
    url.searchParams.set("offset", String(options.offset));
  }
  if (options.count !== undefined) {
    url.searchParams.set("count", String(options.count));
  }
  return url.toString();
}

//transform gazeeter result in polygons
function toGeometry(record: MarineRegionsRecord): Geometry | null {
  const { minLongitude, minLatitude, maxLongitude, maxLatitude } = record;
  if (
    typeof minLongitude === "number" &&
    typeof minLatitude === "number" &&
    typeof maxLongitude === "number" &&
    typeof maxLatitude === "number"
  ) {
    // some records have their min and max swapped: put them back in order
    const west = Math.min(minLongitude, maxLongitude);
    const east = Math.max(minLongitude, maxLongitude);
    const south = Math.min(minLatitude, maxLatitude);
    const north = Math.max(minLatitude, maxLatitude);
    // a box going from e.g. 178 to -151 crosses the antimeridian
    const crossesAntimeridian = minLongitude - maxLongitude > 180;
    if (!crossesAntimeridian && west < east && south < north) {
      return {
        type: "Polygon",
        coordinates: [
          [
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ],
        ],
      };
    }
  }
  if (
    typeof record.longitude === "number" &&
    typeof record.latitude === "number"
  ) {
    return { type: "Point", coordinates: [record.longitude, record.latitude] };
  }
  return null;
}

//transform the result in sdk model(model/index.ts)
function toResult(record: MarineRegionsRecord): GeocodingResult {
  const { preferredGazetteerName, ...properties } = record;
  return {
    label: preferredGazetteerName,
    geom: toGeometry(record),
    properties,
  };
}

export async function queryMarineRegions(
  input: string,
  options?: MarineRegionsOptions,
): Promise<GeocodingResult[]> {
  const name = input.trim();
  if (!name) {
    throw new Error("Input query is required and cannot be empty.");
  }

  const response = await fetch(buildUrl(name, options ?? {}));

  // the service answers 404 with an empty list when nothing matches
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Marine Regions API returned ${response.status}: ${response.statusText}`,
    );
  }
  const records: unknown = await response.json();
  if (!Array.isArray(records)) {
    throw new Error("Invalid response from Marine Regions API: not a list");
  }
  return (records as MarineRegionsRecord[]).map(toResult);
}
