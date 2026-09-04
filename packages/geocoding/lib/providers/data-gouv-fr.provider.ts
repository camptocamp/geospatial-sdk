import { GeocodingResult } from "../model/index.js";
import { queryBaseAdresseNationale } from "./base-adresse-nationale-fr.provider.js";

/**
 * @deprecated The underlying BAN API is deprecated and will be decommissioned end of January 2026;
 * use {@link BaseAdresseNationaleOptions} instead.
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
 * use {@link queryBaseAdresseNationale} instead.
 */
export function queryDataGouvFr(
  input: string,
  options?: DataGouvFrOptions,
): Promise<GeocodingResult[]> {
  console.warn(
    "queryDataGouvFr is deprecated and will be removed; use queryBaseAdresseNationale instead.",
  );
  return queryBaseAdresseNationale(input, {
    index: ["address"],
    type: options?.type ? [options.type] : undefined,
    postCode: options?.postCode ? [options.postCode] : undefined,
    cityCode: options?.cityCode ? [options.cityCode] : undefined,
    limit: options?.limit,
  });
}
