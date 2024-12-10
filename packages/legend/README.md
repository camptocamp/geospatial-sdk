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

## API Documentation

### `createLegendFromLayer(layer: Layer): Promise<HTMLDivElement>`

Creates a legend from a layer.

#### Parameters

- `layer: (MapContextLayer)`: The layer to create the legend from.
- `options: (LegendOptions, optional)`: The options to create the legend.

#### Returns

- `Promise<HTMLElement | false>`: A promise that resolves to the legend element or `false` if the legend could not be created.
