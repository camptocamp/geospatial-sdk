import {
  equals,
  getExtentFromGeojson,
  MapContextView,
  transform,
} from "@geospatial-sdk/core";
import Map from "ol/Map.js";
import View from "ol/View.js";
import type { Extent as OlExtent } from "ol/extent.js";
import { MapContextViewDiff } from "@geospatial-sdk/core/lib/model/map-context-diff.js";

export function updateView(viewChanges: MapContextViewDiff, map: Map): View {
  const view = map.getView();
  const viewProjectionChanged =
    viewChanges === null || viewChanges?.projection !== undefined;
  const maxExtentChanged =
    viewChanges?.maxExtent !== undefined &&
    !equals(view.get("maxExtent"), viewChanges.maxExtent);
  if (viewChanges === null || viewProjectionChanged || maxExtentChanged) {
    map.setView(createView(viewChanges, map));
  } else {
    applyViewProperties(viewChanges, map, view);
  }
  return map.getView();
}

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
  if (viewModel.maxExtent) {
    view.set("maxExtent", viewModel.maxExtent); // TODO: add proper APIs in OpenLayers for this
  }
  applyViewProperties(viewModel, map, view);
  return view;
}

function applyViewProperties(viewModel: MapContextView, map: Map, view: View) {
  // the view project is already correctly set at that point
  const viewProjection = view.getProjection().getCode();

  if (viewModel.maxZoom !== undefined) {
    view.setMaxZoom(viewModel.maxZoom);
  } else {
    view.setMaxZoom(28); // this is the default in OpenLayers
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
