import { Geometry } from "geojson";

export interface GeocodingResult {
  label: string;
  geom: Geometry | null;
}
