[@camptocamp/geospatial-sdk](../../index.md) / [core](../index.md) / computeMapContextDiff

# computeMapContextDiff()

```ts
computeMapContextDiff(nextContext, previousContext): MapContextDiff
```

The following logic is produced by identifying layers in both context
and determining whether they have been added, removed, changed or reordered.

Identifying layers to determine if they have been added/removed/reordered is done like so:
1. For layers with an `id` property, use non-strict equality on it (e.g. '2' and 2 are equivalent);
2. For layers without `id`, compute a hash of their base properties _excluding the `extras` property_

Determining whether layers have changed is done like so:
1. For layers with an `id` property, the value of the `version` field is compared;
   if values are different (using non-strict equality), then the layer is considered to have changed; otherwise
   it is considered to have remained the same
2. For layers without `id`, a full hash is computed _including the `extras` property_;
   this means that a layer which only had changes in its `extras` object will not be considered added/removed,
   but only changed

## Parameters

• **nextContext**: [`MapContext`](../interfaces/MapContext.md)

• **previousContext**: [`MapContext`](../interfaces/MapContext.md)

## Returns

[`MapContextDiff`](../interfaces/MapContextDiff.md)

## Source

[packages/core/lib/utils/map-context-diff.ts:72](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/core/lib/utils/map-context-diff.ts#L72)

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
