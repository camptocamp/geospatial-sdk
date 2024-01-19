import { GeocodingResult } from "../model";

export abstract class BaseProvider {
  private constructor() {}
  abstract query(input: string): Promise<GeocodingResult[]>;
}
