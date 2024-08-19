[geospatial-sdk](../index.md) / core

# core

## Index

### Interfaces

| Interface                                                            | Description                                                    |
| :------------------------------------------------------------------- | :------------------------------------------------------------- |
| [MapContext](interfaces/MapContext.md)                               | -                                                              |
| [MapContextBaseLayer](interfaces/MapContextBaseLayer.md)             | -                                                              |
| [MapContextDiff](interfaces/MapContextDiff.md)                       | Describes a delta between two contexts, in order to be         |
| [MapContextLayer](interfaces/MapContextLayer.md)                     | -                                                              |
| [MapContextLayerGeojson](interfaces/MapContextLayerGeojson.md)       | -                                                              |
| [MapContextLayerPositioned](interfaces/MapContextLayerPositioned.md) | Associates a position to a layer; the position is the index of |
| [MapContextLayerReordered](interfaces/MapContextLayerReordered.md)   | Describes a layer being moved to a different position          |
| [MapContextLayerWfs](interfaces/MapContextLayerWfs.md)               | -                                                              |
| [MapContextLayerWms](interfaces/MapContextLayerWms.md)               | -                                                              |
| [MapContextLayerWmts](interfaces/MapContextLayerWmts.md)             | -                                                              |
| [MapContextLayerXyz](interfaces/MapContextLayerXyz.md)               | -                                                              |
| [MapContextView](interfaces/MapContextView.md)                       | -                                                              |

### Type Aliases

| Type alias                                         | Description                |
| :------------------------------------------------- | :------------------------- |
| [Coordinate](type-aliases/Coordinate.md)           | -                          |
| [Extent](type-aliases/Extent.md)                   | Min X, min Y, max X, max Y |
| [LayerDimensions](type-aliases/LayerDimensions.md) | -                          |
| [LayerExtras](type-aliases/LayerExtras.md)         | -                          |

### Functions

| Function                                                    | Description                                                                       |
| :---------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| [computeMapContextDiff](functions/computeMapContextDiff.md) | The following logic is produced by identifying layers in both context             |
| [deepFreeze](functions/deepFreeze.md)                       | -                                                                                 |
| [removeSearchParams](functions/removeSearchParams.md)       | Removes the given search params from the URL completely; this is case-insensitive |

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
