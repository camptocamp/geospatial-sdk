import { Geometry } from "geojson";

export type GeocodingProvider = "geoadmin";

export interface GeocodingResult {
  label: string;
  geom: Geometry | null;
}
