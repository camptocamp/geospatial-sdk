# `legend`

> A library to get legend graphics from the map-context.

## Installation

To install the package, use npm:

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

## Examples

For examples and demos, see the [examples website](https://camptocamp.github.io/geospatial-sdk/).
