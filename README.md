# Geospatial SDK

**A modular toolkit for building web mapping applications painlessly and reliably.**

This repository contains a collection of framework-agnostic JavaScript/TypeScript packages designed to simplify geospatial application development. The SDK provides a declarative, library-independent approach to working with web maps, letting you focus on your application logic rather than low-level mapping APIs.

## Philosophy

The Geospatial SDK is built on three core principles:

1. **Declarative Map Configuration**: maps are defined using plain JavaScript objects (called map contexts) instead of imperative API calls. This makes maps easier to serialize in an application state, as well as share across users etc.

2. **Modular Design**: the SDK is composed of several packages which have different roles; only the `@geospatial-sdk/core` package is required. All packages share the same models. This allows for instance to create maps using different libraries.

3. **Composition over Inheritance**: the SDK does not extend classes coming from mapping libraries in an effort to provide additional features. Instead, it provides utilities to create and manage maps and other objects (layers, sources...), and leaves the user the freedom to use these classes directly if needed.

## Packages

This monorepo contains the following packages:

- **`@geospatial-sdk/core`**: Core types and utilities, including the Map Context model and diff algorithms
- **`@geospatial-sdk/openlayers`**: OpenLayers integration for creating and managing maps from Map Context
- **`@geospatial-sdk/maplibre`**: MapLibre GL integration for creating and managing maps from Map Context
- **`@geospatial-sdk/geocoding`**: Geocoding providers and utilities
- **`@geospatial-sdk/legend`**: Generate legends from map layers
- **`@geospatial-sdk/elements`**: Web Components for displaying a map from a Map Context

## Getting Started

### Quick Example

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

### Learn More

- **[Live Examples](./apps/examples)**: Interactive demos showing common use cases
- **[Documentation](./docs)**: Full API reference and guides
- **[API Documentation](./docs/api)**: Generated TypeScript API documentation

## Development

### Initial Setup

```shell
npm install
```

### Running Tests

```shell
npm run test
```

### Building All Packages

```shell
npm run build
```

### Documentation

To run the documentation site locally:

```shell
npm run docs:dev
```

To explore interactive examples:

```shell
cd apps/examples
npm run dev
```

## Contributing

This is a monorepo managed by Lerna. Each package has its own `package.json` and can be developed independently. Changes to shared dependencies or the build configuration should be tested across all packages.

### Project Structure

```
packages/        # Published npm packages
apps/examples/   # Application with interactive examples
docs/            # Documentation website
```

## License

BSD-3-Clause
