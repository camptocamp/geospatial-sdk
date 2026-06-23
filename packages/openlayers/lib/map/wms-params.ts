import { MapContextLayerWms } from "@geospatial-sdk/core";

/**
 * Builds the WMS request params (excluding transport-specific ones like `TILED`)
 * from a layer model. Dimension keys are uppercased per the WMS convention and
 * `Date` values are serialized to ISO strings.
 *
 * Shared between layer creation and incremental updates so both stay in sync.
 */
export function buildWmsParams(
  layerModel: MapContextLayerWms,
): Record<string, unknown> {
  return {
    LAYERS: layerModel.name,
    ...(layerModel.format && { FORMAT: layerModel.format }),
    ...(layerModel.style && { STYLES: layerModel.style }),
    ...(layerModel.dimensionValues &&
      Object.fromEntries(
        Object.entries(layerModel.dimensionValues).map(([k, v]) => [
          k.toUpperCase(),
          v instanceof Date ? v.toISOString() : v,
        ]),
      )),
    ...(layerModel.customParams ?? {}),
  };
}
