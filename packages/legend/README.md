# `@geospatial-sdk/legend`

<!-- #region body -->

This package provides utilities to automatically create map legends from layer definitions in a Map Context.

## Installation

```sh
npm install @geospatial-sdk/legend
```

## Usage

### Rendering a legend

```typescript
import { createLegendFromLayer } from "@geospatial-sdk/legend";

const layer = {
  type: "wms",
  url: "https://example.com/wms",
  name: "test-layer",
};

createLegendFromLayer(layer).then((legendDiv) => {
  document.body.appendChild(legendDiv);
});
```

### Checking legend support

Use `hasLegendSupport` to check whether a layer can have a legend before attempting to render one. It is a type guard: narrowing the layer to `MapContextLayerWms | MapContextLayerWmts`.

```typescript
import {
  hasLegendSupport,
  createLegendFromLayer,
} from "@geospatial-sdk/legend";

if (hasLegendSupport(layer)) {
  // layer is narrowed to MapContextLayerWms | MapContextLayerWmts
  createLegendFromLayer(layer).then((legendDiv) => {
    if (legendDiv) document.body.appendChild(legendDiv);
  });
}
```

Note: `hasLegendSupport` is a type-level check only. A WMTS layer may still return `null` from `createLegendFromLayer` if no legend URL is declared in its capabilities.

<!-- #endregion body -->

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
