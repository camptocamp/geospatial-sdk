/**
 * @group Utils
 * @packageDocumentation
 */

export * from "./url.js";
export * from "./freeze.js";
export * from "./hash.js";
export {
  getCrs,
  setCrs,
  transform,
  toGeographic,
  equals,
  extend,
} from "./coordinates.js";
export { computeMapContextDiff } from "./map-context-diff.js";
export {
  getLayerPosition,
  addLayerToContext,
  removeLayerFromContext,
  replaceLayerInContext,
  changeLayerPositionInContext,
  updateLayerInContext,
} from "./map-context.js";
export { updateLayer } from "./map-context-layer.js";
export { createViewFromLayer } from "./view.js";
export * from "./style.js";
export {
  ensureGeojson,
  getExtentFromGeojson,
  getExtentFromGeometry,
} from "./geojson.js";
