# `@geospatial-sdk/legend`

This package provides utilities to automatically create map legends from layer definitions in a Map Context.

## Installation

```sh
npm install @geospatial-sdk/legend
```

## Usage

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

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
