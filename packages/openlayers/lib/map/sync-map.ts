import { computeMapContextDiff, MapContext } from "@geospatial-sdk/core";
import Map from "ol/Map.js";
import { createMapFromContext } from "./create-map.js";
import { applyContextDiffToMap } from "./apply-context-diff.js";

export interface MapSyncHandle {
  /** The OpenLayers map created from the initial context. */
  map: Map;
  /** Unsubscribe from the context source and stop applying further diffs. */
  stop: () => void;
}

/**
 * Create a map from a context source and keep it in sync as the context changes.
 *
 * Framework-agnostic: the caller supplies `getContext` (reads the current
 * context) and `subscribe` (registers a change callback, returns an unsubscribe
 * function). A Vue caller passes a `watch`; a Lit caller re-renders, etc.
 *
 * This handles three races that a naive `create then watch(applyDiff)` misses:
 *
 * 1. The context can change while `createMapFromContext` is still awaited. The
 *    map would otherwise be built from a stale context and the missed change
 *    silently dropped, so we diff against the current context once the map is
 *    ready and apply the catch-up.
 * 2. The previous context must be the one actually *applied*, not the value a
 *    framework captured at subscribe time (which goes stale across the await).
 *    We track `lastApplied` ourselves.
 * 3. `applyContextDiffToMap` is async; rapid changes would otherwise interleave
 *    on the same map. Applies are serialized through a promise chain.
 */
export async function syncMapWithContext(
  target: string | HTMLElement,
  getContext: () => MapContext,
  subscribe: (onChange: () => void) => () => void,
): Promise<MapSyncHandle> {
  const initialContext = getContext();
  const map = await createMapFromContext(initialContext, target);

  let lastApplied = initialContext;
  let chain: Promise<unknown> = Promise.resolve();
  let stopped = false;

  function enqueueApply(next: MapContext) {
    const previous = lastApplied;
    lastApplied = next;
    chain = chain.then(() => {
      if (stopped) return;
      const diff = computeMapContextDiff(next, previous);
      return applyContextDiffToMap(map, diff);
    });
    return chain;
  }

  // Catch up on any change that landed while the map was being created.
  const currentContext = getContext();
  if (currentContext !== initialContext) {
    enqueueApply(currentContext);
  }

  const unsubscribe = subscribe(() => {
    if (stopped) return;
    enqueueApply(getContext());
  });

  return {
    map,
    stop: () => {
      stopped = true;
      unsubscribe();
    },
  };
}
