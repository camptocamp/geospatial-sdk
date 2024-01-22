[@camptocamp/geospatial-sdk](../../index.md) / [core](../index.md) / MapContextDiff

# MapContextDiff

Describes a delta between two contexts, in order to be
applied to an existing map.

For positions to be correct the order of operations should be:
1. change layers
2. remove layers
3. add layers
4. move layers

## Properties

### layersAdded

```ts
layersAdded: MapContextLayerPositioned[];
```

#### Source

[packages/core/lib/model/map-context-diff.ts:35](https://github.com/jahow/geospatial-sdk/blob/dbfbbb6/packages/core/lib/model/map-context-diff.ts#L35)

***

### layersChanged

```ts
layersChanged: MapContextLayerPositioned[];
```

#### Source

[packages/core/lib/model/map-context-diff.ts:32](https://github.com/jahow/geospatial-sdk/blob/dbfbbb6/packages/core/lib/model/map-context-diff.ts#L32)

***

### layersRemoved

```ts
layersRemoved: MapContextLayerPositioned[];
```

#### Source

[packages/core/lib/model/map-context-diff.ts:34](https://github.com/jahow/geospatial-sdk/blob/dbfbbb6/packages/core/lib/model/map-context-diff.ts#L34)

***

### layersReordered

```ts
layersReordered: MapContextLayerReordered[];
```

#### Source

[packages/core/lib/model/map-context-diff.ts:33](https://github.com/jahow/geospatial-sdk/blob/dbfbbb6/packages/core/lib/model/map-context-diff.ts#L33)

***

### viewChanges

```ts
viewChanges: MapContextView;
```

#### Source

[packages/core/lib/model/map-context-diff.ts:36](https://github.com/jahow/geospatial-sdk/blob/dbfbbb6/packages/core/lib/model/map-context-diff.ts#L36)

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
