---
outline: deep
editLink: true
lastUpdated: true
---

# Introduction

The **Geospatial SDK** is a modular toolkit for building web mapping applications faster and with less boilerplate. It provides a set of battle-tested utilities and stable interfaces that can be reused across many different projects.

## What Problem Does It Solve?

Building web maps typically involves:

- **Tight coupling** to specific mapping libraries (OpenLayers, MapLibre GL, Leaflet, etc.)
- **Imperative code** that's difficult to serialize or share across users
- **Complex state management** when maps need to update dynamically
- **Repetitive boilerplate** for common geospatial tasks like geocoding or legends

The Geospatial SDK addresses these challenges by providing a **declarative Map Context model** that separates map configuration from rendering, along with utilities for common geospatial operations.

## Key Features

### Declarative Map Configuration

Define maps using plain JavaScript objects called [**Map Contexts**](./map-context.md). This makes maps:

- **Serializable**: Easy to store in an application state or in a database
- **Shareable**: Reuse and share map configurations between users or applications
- **Framework-agnostic**: Use the same configuration with different rendering libraries

```typescript
const mapContext = {
  layers: [
    {
      type: "xyz",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
  ],
  view: {
    zoom: 5,
    center: [6, 48.5],
  },
};
```

### Smart Map Updates

The SDK provides [**a Map Context diff system**](./map-context-diff.md) that compute the minimal changes needed to update an existing map. Instead of recreating everything, only modified layers and view properties are updated—improving performance and preserving map state.

### Modular Architecture

Only include the packages needed for your project:

- `@geospatial-sdk/core`: Map Context types and utilities (required)
- `@geospatial-sdk/openlayers`: OpenLayers integration
- `@geospatial-sdk/maplibre`: MapLibre GL integration
- `@geospatial-sdk/geocoding`: Geocoding providers
- `@geospatial-sdk/legend`: Legend generation
- `@geospatial-sdk/elements`: Web Components for maps

See the [API reference](../api/) for more information.

### Support for Multiple Layer Types

Support for common geospatial data sources out of the box:

- XYZ tiles (raster and vector)
- OGC standards (WMS, WMTS, WFS, OGC API)
- GeoJSON (inline or from URLs)
- MapLibre Style Spec
- etc.

## Quick Start

Install the core package and a rendering library:

```bash
npm install @geospatial-sdk/core @geospatial-sdk/openlayers
```

Create a map from a Map Context:

```typescript
import { createMapFromContext } from "@geospatial-sdk/openlayers";

const mapContext = {
  layers: [
    {
      type: "xyz",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
  ],
  view: {
    zoom: 5,
    center: [6, 48.5],
  },
};

createMapFromContext(mapContext, document.getElementById("map"));
```

## Next Steps

- Explore the [API documentation](../api/) for detailed package references
- Check out [live examples](https://camptocamp.github.io/geospatial-sdk/) to see the SDK in action
