import { BackgroundLayerSpecification, LayerSpecification } from "maplibre-gl";
import { MapContextLayerGeojson, MapContextLayerOgcApi, MapContextLayerWfs } from "@geospatial-sdk/core";

export type LayerSpecificationWithSource = Exclude<
  LayerSpecification,
  BackgroundLayerSpecification
>;

export type LayerContextWithStyle = MapContextLayerWfs | MapContextLayerOgcApi | MapContextLayerGeojson
