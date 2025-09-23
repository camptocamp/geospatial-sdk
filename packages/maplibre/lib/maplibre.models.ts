import { BackgroundLayerSpecification, LayerSpecification } from "maplibre-gl";

export type LayerSpecificationWithSource = Exclude<LayerSpecification, BackgroundLayerSpecification>