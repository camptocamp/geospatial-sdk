import proj4 from "proj4";
import { DEFAULT_MAP_VIEW_CRS } from "../constant/projections.js";
import {
  CrsIdentifier,
  MapContext,
  MapContextView,
} from "../model/map-context.js";
import { MapContextDiff } from "../model/map-context-diff.js";
import { getCrs } from "./coordinates.js";

/**
 * Returns the CRS codes referenced by a view (display CRS, center, extent, max extent)
 */
export function getViewCrsCodes(view: MapContextView): Set<CrsIdentifier> {
  const codes = new Set<CrsIdentifier>([
    view.projection ?? DEFAULT_MAP_VIEW_CRS,
  ]);
  if ("center" in view && view.center) codes.add(getCrs(view.center));
  if ("extent" in view && view.extent) codes.add(getCrs(view.extent));
  if (view.maxExtent) codes.add(getCrs(view.maxExtent));
  return codes;
}

/**
 * Returns all the CRS codes used in a map context
 */
export function getContextCrsCodes(context: MapContext): Set<CrsIdentifier> {
  // TODO: check for geometries (e.g. GeoJSON)

  if (!context.view) return new Set();
  return getViewCrsCodes(context.view);
}

/**
 * Returns all the CRS codes used in a map context diff
 */
export function getDiffCrsCodes(diff: MapContextDiff): Set<CrsIdentifier> {
  // TODO: check for geometries (e.g. GeoJSON)

  if (!diff.viewChanges) return new Set();
  return getViewCrsCodes(diff.viewChanges);
}

function isRegistered(code: CrsIdentifier): boolean {
  // consider Web Mercator and Geographic as known
  if (code === "EPSG:3857" || code === "EPSG:4326") return true;
  return !!proj4.defs(code);
}

async function registerCrs(code: CrsIdentifier): Promise<void> {
  if (typeof code !== "string" || !code.includes(":")) {
    throw new Error(`Invalid code`);
  }
  const [authority, num] = code.toLowerCase().split(":", 2);
  const response = await fetch(
    `https://spatialreference.org/ref/${authority}/${num}/ogcwkt/`,
  );
  if (!response.ok) {
    throw new Error(
      `Unexpected response from spatialreference.org: ${response.status}`,
    );
  }
  const def = await response.text();
  proj4.defs(code, def);
}

/**
 * Makes sure all given CRS codes are registered, looking up the missing ones.
 * @throws Error if the definition of a CRS cannot be fetched
 */
export async function ensureCrsRegistered(
  codes: Set<CrsIdentifier>,
): Promise<void> {
  const missing = Array.from(codes).filter((code) => !isRegistered(code));
  await Promise.all(
    missing.map(async (code) => {
      try {
        await registerCrs(code);
      } catch (e) {
        throw new Error(
          `Could not find a definition for CRS "${code}": ${(e as Error)?.message ?? e}`,
        );
      }
    }),
  );
}

/**
 * Makes sure all CRS used in a map context are registered
 * @throws Error if the definition of a CRS cannot be fetched
 */
export function ensureContextCrsReady(context: MapContext): Promise<void> {
  return ensureCrsRegistered(getContextCrsCodes(context));
}

/**
 * Makes sure all CRS used in a map context diff are registered
 * @throws Error if the definition of a CRS cannot be fetched
 */
export function ensureDiffCrsReady(diff: MapContextDiff): Promise<void> {
  return ensureCrsRegistered(getDiffCrsCodes(diff));
}
