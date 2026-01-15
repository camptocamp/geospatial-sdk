# `@geospatial-sdk/core`

<!-- #region body -->

This package provides the foundation for the Geospatial SDK.

It includes:

- **Map Context model**: TypeScript types and interfaces for declaratively defining maps, layers, and views
- **Diff algorithms**: Utilities to compute differences between Map Context objects (`computeMapContextDiff`)
- **Validation utilities**: Tools for working with and validating geospatial data
- **Shared constants**: Common definitions used across all packages

The `@geospatial-sdk/core` package is framework-agnostic and does not depend on any specific mapping library. It's required by all other packages in the SDK.

## Installation

```sh
npm install @geospatial-sdk/core
```

## Usage

```typescript
import { computeMapContextDiff, type MapContext } from '@geospatial-sdk/core';

const oldContext: MapContext = {
  layers: [{ type: 'xyz', url: 'https://example.com/{z}/{x}/{y}.png' }],
  view: { center: [0, 0], zoom: 2 }
};

const newContext: MapContext = {
  layers: [{ type: 'xyz', url: 'https://example.com/{z}/{x}/{y}.png' }],
  view: { center: [5, 45], zoom: 5 }
};

const diff = computeMapContextDiff(newContext, oldContext);
```

<!-- #endregion body -->

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
