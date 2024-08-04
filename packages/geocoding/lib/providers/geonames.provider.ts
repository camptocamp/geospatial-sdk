import { GeocodingResult } from "../model";
import { Geometry } from "geojson";

const baseUrl = "https://secure.geonames.org/searchJSON";

/**
 * Reference documentation: http://www.geonames.org/export/geonames-search.html
 * @property lang Default is English. Either "local" or iso2 country code should be used
 * @property maxRows The maximal number of rows in the document returned by the service. Default is 100
 * @property country Default is all countries. The country parameter may occur more than once, example: country=FR&country=GP
 * @property style verbosity of returned xml document, default = MEDIUM
 * @property type The format type of the returned document, default = xml
 * @property username The parameter 'username' needs to be passed with each request. (https://www.geonames.org/login)
 * @property east, west, north, south Restrict the search to the given bounding box
 */

export interface GeonamesOptions {
  lang?: string;
  maxRows?: number;
  country?: string | string[]; // Now supports multiple countries
  style?: "SHORT" | "MEDIUM" | "LONG" | "FULL";
  username: string;
  east?: number;
  west?: number;
  north?: number;
  south?: number;
}

interface GeonameResponse {
  name: string;
  lng: string;
  lat: string;
}

export function queryGeonames(
  input: string,
  options?: GeonamesOptions,
): Promise<GeocodingResult[]> {
  if (!input.trim()) {
    throw new Error("Input query is required and cannot be empty.");
  }

  const baseOptions: GeonamesOptions = {
    lang: "en",
    maxRows: 10,
    style: "FULL",
    username: "gn_ui",
  };

  const finalOptions = { ...baseOptions, ...options };

  const url = new URL(baseUrl);
  url.searchParams.set("q", input.trim());
  url.searchParams.set("username", finalOptions.username);
  finalOptions.maxRows &&
    url.searchParams.set("maxRows", finalOptions.maxRows.toString());
  if (typeof finalOptions.country === "string") {
    url.searchParams.set("country", finalOptions.country);
  } else if (Array.isArray(finalOptions.country)) {
    finalOptions.country.forEach((c) => url.searchParams.append("country", c));
  }
  finalOptions.lang && url.searchParams.set("lang", finalOptions.lang);
  finalOptions.style && url.searchParams.set("style", finalOptions.style);
  url.searchParams.set("type", "json");

  if (
    finalOptions.east !== undefined &&
    finalOptions.west !== undefined &&
    finalOptions.north !== undefined &&
    finalOptions.south !== undefined &&
    finalOptions.east > finalOptions.west &&
    finalOptions.north > finalOptions.south
  ) {
    url.searchParams.set("east", finalOptions.east.toString());
    url.searchParams.set("west", finalOptions.west.toString());
    url.searchParams.set("north", finalOptions.north.toString());
    url.searchParams.set("south", finalOptions.south.toString());
  }

  return fetch(url.toString())
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Geonames API returned ${response.status}: ${response.statusText}`,
        );
      }
      return response.json();
    })
    .then((data: { geonames: GeonameResponse[] }) => {
      if (!data.geonames) {
        throw new Error(
          "Invalid response from Geonames API: no geonames property",
        );
      }
      return data.geonames.map((geoname) => ({
        label: geoname.name,
        geom: {
          type: "Point",
          coordinates: [parseFloat(geoname.lng), parseFloat(geoname.lat)],
        } as Geometry,
      }));
    });
}
