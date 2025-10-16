import { Map } from "maplibre-gl";
import { LayerSpecificationWithSource } from "../maplibre.models";

export function removeLayerFromSource(map: Map, sourceId: string) {
  const layers = map.getStyle().layers;
  const layersWithSource  = layers.filter(
    (layer) => layer.type !== "background",
  ) as LayerSpecificationWithSource[]
  const layerIds = layersWithSource.filter(
    (layer) => layer.hasOwnProperty("source") && layer.source === sourceId,
  ).map(layer => layer.id)
  layerIds.forEach(layer => map.removeLayer(layer));
}