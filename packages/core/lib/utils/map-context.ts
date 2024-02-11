import { MapContext, MapContextLayer } from "../model";

export function getLayerHash(
  layer: MapContextLayer,
  includeExtras = false,
): string {
  function getHash(input: unknown): string {
    if (input instanceof Object) {
      const obj: Record<string, string> = {};
      const keys = Object.keys(input).sort();
      for (const key of keys) {
        if (!includeExtras && key === "extras") continue;
        obj[key] = getHash(input[key as keyof typeof input]);
      }
      const hash = JSON.stringify(obj)
        .split("")
        .reduce((prev, curr) => (prev << 5) - prev + curr.charCodeAt(0), 0);
      return (hash >>> 0).toString();
    } else {
      return JSON.stringify(input);
    }
  }
  return getHash(layer);
}

export function isLayerSame(
  layerA: MapContextLayer,
  layerB: MapContextLayer,
): boolean {
  if ("id" in layerA && "id" in layerB) {
    return layerA.id == layerB.id;
  }
  return getLayerHash(layerA) === getLayerHash(layerB);
}

export function isLayerSameAndUnchanged(
  layerA: MapContextLayer,
  layerB: MapContextLayer,
): boolean {
  if ("id" in layerA && "id" in layerB) {
    return layerA.id == layerB.id && layerA.version == layerB.version;
  }
  return getLayerHash(layerA, true) === getLayerHash(layerB, true);
}

export function getLayerPosition(
  context: MapContext,
  layerModel: MapContextLayer,
): number {
  return context.layers.findIndex((l) => isLayerSame(layerModel, l));
}
