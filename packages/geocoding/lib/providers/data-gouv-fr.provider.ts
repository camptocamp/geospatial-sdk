import { GeocodingResult } from "../model/index.js";
import { queryGeoplateforme } from "./geoplateforme.provider.js";

/**
 * @deprecated The underlying BAN API is deprecated and will be decommissioned end of January 2026;
 * use {@link GeoplateformeOptions} instead.
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

/**
 * @deprecated The underlying BAN API is deprecated and will be decommissioned end of January 2026;
 * use {@link queryGeoplateforme} instead.
 */
export function queryDataGouvFr(
  input: string,
  options?: DataGouvFrOptions,
): Promise<GeocodingResult[]> {
  console.warn(
    "queryDataGouvFr is deprecated and will be removed; use queryGeoplateforme instead.",
  );
  return queryGeoplateforme(input, {
    index: ["address"],
    type: options?.type ? [options.type] : undefined,
    postCode: options?.postCode ? [options.postCode] : undefined,
    cityCode: options?.cityCode ? [options.cityCode] : undefined,
    limit: options?.limit,
  });
}
