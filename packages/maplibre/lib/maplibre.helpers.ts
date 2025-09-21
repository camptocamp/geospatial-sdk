import { Feature, Geometry } from "geojson";

export function getGeometryTypes(features: Feature<Geometry>[]): string[] {
  return features.reduce((types: string[], feature) => {
    const type = feature.geometry.type.toLocaleLowerCase();
    if (!types.includes(type)) {
      types.push(type);
    }
    return types;
  }, []);
}
