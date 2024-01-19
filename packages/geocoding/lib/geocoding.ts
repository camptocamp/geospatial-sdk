import { BaseProvider } from "./providers";
import { GeocodingResult } from "./model";

export function query(
  input: string,
  provider: BaseProvider,
): Promise<GeocodingResult[]> {
  return provider.query(input);
}
