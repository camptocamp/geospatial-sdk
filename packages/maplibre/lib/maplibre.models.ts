import {
  BackgroundLayerSpecification,
  LayerSpecification,
  StyleSpecification,
} from "maplibre-gl";
import {
  MapContextLayerGeojson,
  MapContextLayerOgcApi,
  MapContextLayerWfs,
} from "@geospatial-sdk/core";

export type LayerSpecificationWithSource = Exclude<
  LayerSpecification,
  BackgroundLayerSpecification
>;

export type LayerContextWithStyle =
  | MapContextLayerWfs
  | MapContextLayerOgcApi
  | MapContextLayerGeojson;

export type Dataset = Pick<StyleSpecification, "sources" | "layers">;

export type PartialStyleSpecification = Dataset & {
  glyphs?: StyleSpecification["glyphs"];
  sprite?: StyleSpecification["sprite"];
};
