# `@geospatial-sdk/geocoding`

<!-- #region body -->

This package provides a unified interface for working with various geocoding services.

## Installation

```sh
npm install @geospatial-sdk/geocoding
```

## Usage

```typescript
import { queryDataGouvFr } from "@geospatial-sdk/geocoding";

const results = await queryDataGouvFr("Paris, France");
console.log(results[0].label); // "Paris 75000"
console.log(results[0].geom); // GeoJSON Geometry object
```

<!-- #endregion body -->

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
