import {
  getExtentFromGeojson,
  MapContextView,
  transform,
} from "@geospatial-sdk/core";
import Map from "ol/Map.js";
import View from "ol/View.js";
import type { Extent as OlExtent } from "ol/extent.js";

export function createView(viewModel: MapContextView | null, map: Map): View {
  if (viewModel === null) {
    return new View({
      center: [0, 0],
      zoom: 0,
    });
  }
  const projection = viewModel.projection ?? "EPSG:3857";
  const view = new View({
    projection,
    ...(viewModel.maxExtent && {
      extent: transform(viewModel.maxExtent, projection) as OlExtent,
    }),
    multiWorld: false,
    constrainResolution: true,
  });
  applyViewProperties(viewModel, map, view);
  return view;
}

export function applyViewProperties(
  viewModel: MapContextView,
  map: Map,
  view: View,
) {
  const viewProjection = viewModel.projection ?? "EPSG:3857";
  if (viewModel.maxZoom !== undefined) {
    view.setMaxZoom(viewModel.maxZoom);
  } else {
    view.setMaxZoom(Infinity);
  }
  if ("geometry" in viewModel) {
    const extent = transform(
      getExtentFromGeojson(viewModel.geometry),
      viewProjection,
    );
    view.fit(extent as OlExtent, {
      size: map.getSize(),
    });
  } else if ("extent" in viewModel) {
    view.fit(transform(viewModel.extent, viewProjection) as OlExtent, {
      size: map.getSize(),
    });
  } else {
    const { center: centerInModel, zoom } = viewModel;
    const center = centerInModel
      ? transform(centerInModel, viewProjection).slice(0, 2)
      : [0, 0];
    view.setCenter(center as [number, number]);
    view.setZoom(zoom !== undefined ? zoom : 0);
  }
}
