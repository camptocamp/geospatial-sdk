---
outline: deep
editLink: true
lastUpdated: true
---

# Map Context Diff

The Geospatial SDK offers a utility to compute the difference or "diff" between two Map Context objects. This is important to allow updating an existing map by providing a modified Map Context and not having to recreate all objects that are part of that map.

## Core Concept

```typescript
import { computeMapContextDiff } from '@geospatial-sdk/core'
import { applyContextDiffToMap } from '@geospatial-sdk/openlayers'

const oldContext = {
    layers: [...],
    view: {...}
}
const newContext = {
    // both of those properties may contain changes
    layers: [...],
    view: {...}
}

const diff = computeMapContextDiff(newContext, oldContext)
await applyContextDiffToMap(openlayersMap, diff)
```

Important things to note:
* The diff computation is done by the `@geospatial-sdk/core` package, as is everything that relates to abstract Map Context objects
* The diff is then applied to an existing map using a function from the `@geospatial-sdk/openlayers` package (the same function exists in the `@geospatial-sdk/maplibre` package for MapLibre GL JS maps); this is because applying a diff involved API calls for that specific mapping library

## `MapContextDiff` Structure

A diff object contains five properties describing the changes between a "prev" (or "old") and a "next" (or "new") context:

```typescript
interface MapContextDiff {
  layersAdded: MapContextLayerPositioned[]      // New layers with their positions
  layersRemoved: MapContextLayerPositioned[]    // Removed layers with their positions
  layersChanged: MapContextLayerPositioned[]    // Modified layers with their positions
  layersReordered: MapContextLayerReordered[]   // Layers with their old and new positions
  viewChanges?: MapContextView | null           // New view (undefined if unchanged)
}
```

::: tip
**The `viewChanges` property is optional**: if not defined, it means the view did not change. But it can also have a value of `null`, meaning the view changed to the default view! Both are two different things.
:::

## Layer Tracking & Change Detection

In order to figure out whether layers were moved and/or updated the SDK needs a way to track layers across several contexts.

::: info
The SDK **does not use reference equality** when trying to figure out whether layers are the same or not. It always looks at _what the layer objects contain_! 
:::

The SDK uses two strategies to recognize layers across several contexts:

### Layers with an `id` property
- **Identity**: Two layers having the same `id` are **considered the same** (non-strict equality: `'2'` == `2`)
- **Change detection**: Two layers having the same `id` but different values in their `version` properties are **considered to be two versions of the same** (i.e. the layer was changed between the two contexts)

```typescript
{ id: 'roads', version: 1, type: 'wms', url: '...', name: 'roads' }
{ id: 'roads', version: 2, type: 'wms', url: '...', name: 'roads' } // Changed
```

::: tip
When the SDK compares two layers having the same `id` _and no `version` property_, **it will look at the contents of the layers for change detection** (i.e. to determine whether there are changes between the two) in order to avoid counter-intuitive behaviors.
:::

### Layers without an `id` property

If any of the two layers being compared does not have an `id` property, the SDK falls back to these rules for comparison:

- **Identity**: Two layers having the same content (deep comparison, hash-based) are **considered the same**; this does not include the contents of the `extras` property!
- **Change detection**: Two layers having the same content (deep comparison) _including the `extras` property_ are 

```typescript
{ type: 'wms', url: '...', name: 'roads' }
{ type: 'wms', url: '...', name: 'roads', extras: { foo: 'bar' } } // Changed
```

## Application Order

When applying a diff, operations must follow this order to obtain the correct final state:

1. **Remove layers**
2. **Add layers**
3. **Reorder layers**
4. **Update changed layers** (either by adjusting or recreating in place)

The `applyContextDiffToMap` functions from `@geospatial-sdk/openlayers` and `@geospatial-sdk/maplibre` are implemented to follow that consideration.

The view changes can be applied independently.


