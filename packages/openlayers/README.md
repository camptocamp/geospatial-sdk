# `@geospatial-sdk/openlayers`

<!-- #region body -->

This package provides utilities to create and manage [OpenLayers](https://openlayers.org/) maps using the declarative Map Context model from `@geospatial-sdk/core`.

## Installation

```sh
npm install @geospatial-sdk/openlayers
```

## Usage

```typescript
import { createMapFromContext } from "@geospatial-sdk/openlayers";
import type { MapContext } from "@geospatial-sdk/core";

const mapContext: MapContext = {
  layers: [
    {
      type: "xyz",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
  ],
  view: {
    center: [6, 48.5],
    zoom: 5,
  },
};

const map = await createMapFromContext(
  mapContext,
  document.getElementById("map"),
);
```

<!-- #endregion body -->

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
