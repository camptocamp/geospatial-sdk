# `@geospatial-sdk/style`

<!-- #region body -->

This package provides utilities to create and convert styles for rendering maps.

## Installation

```sh
npm install @geospatial-sdk/style
```

## Usage

```typescript
import { openLayersStyleToMapLibreLayers } from "@geospatial-sdk/style";

const olStyle = {
  "fill-color": "orange",
};
const mapLibreLayers = openLayersStyleToMapLibreLayers(olStyle);
```

<!-- #endregion body -->

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
