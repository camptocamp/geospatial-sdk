# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```shell
npm run test          # vitest across all packages (vitest.config.ts uses projects: packages/*)
npm run build         # lerna run build — compiles each package with tsc to dist/
npm run lint          # eslint **/*.{js,ts,vue}
npm run typecheck     # tsc --noEmit
npm run format:check  # prettier check; format:write to fix
npm run docs:dev      # run the VitePress docs site locally
```

Run a single test file or filter:

```shell
npx vitest run packages/core/lib/utils/map-context-diff.test.ts
npx vitest -t "name of test"          # by test name
npx vitest --project core             # one package's project
```

Interactive examples (Vue app): `cd apps/examples && npm run dev`.

## Architecture

Lerna/npm-workspaces monorepo. The published packages live in `packages/*`; `apps/examples` (Vue) and `docs` (VitePress + TypeDoc) are workspaces but not published. Each package builds independently via `tsc` and exposes its public API from `lib/index.ts`.

### Map Context: the central abstraction

Everything is built around the **Map Context** — a plain serializable object (`MapContext` in `packages/core/lib/model/map-context.ts`) describing `{ layers, view }`. Maps are declared as data, not built imperatively. This is what makes map state serializable into application state and shareable.

- `MapContextLayer` is a discriminated union on `type` (`wms`, `wmts`, `wfs`, `xyz`, `geojson`, `ogcapi`, `maplibre-style`, `geotiff`). All layer types extend `MapContextBaseLayer` (visibility, opacity, attributions, `id`, `version`, `extras`, etc.). Vector layer types also mix in `MapContextLayerVector` (style/hoverStyle).
- `MapContextView` is a union of three viewport descriptions: by center+zoom, by extent, or by GeoJSON geometry. All coordinates/extents are in **lon/lat**.

### Diffing drives map updates

State changes flow through a diff, not direct mutation:

1. `computeMapContextDiff(next, current)` (`packages/core/lib/utils/map-context-diff.ts`) produces a `MapContextDiff` — `layersAdded`, `layersRemoved`, `layersReordered`, `layersChanged`, `viewChanges`.
2. A renderer applies the diff to a real map. For OpenLayers: `applyContextDiffToMap` / `createMapFromContext` / `resetMapFromContext` in `packages/openlayers/lib/map/`.
3. **Diff ordering matters**: operations must be applied as remove → add → move → change for positions to stay correct (documented on `MapContextDiff`).

Change detection on a layer uses `id` + `version` when present (cheap), otherwise falls back to deep comparison. Setting an `id` and bumping `version` is the performant way to signal a layer changed.

### Package roles

- **`core`** — models (`lib/model/`), diff algorithm, context-manipulation utils (`addLayerToContext`, `updateLayerInContext`, …), event types, projections. The only required package. Has `ol` as a _peer_ dependency (used for some types/extent math).
- **`openlayers`** — renders a Map Context with OpenLayers; the most complete renderer. Holds the create-map / apply-diff / event-listening logic. Does **not** subclass OpenLayers classes (composition over inheritance — a core design principle).
- **`maplibre`** — MapLibre GL renderer; depends on `core` + `style`.
- **`style`** — style models and conversion shared by renderers.
- **`legend`** — derive legend graphics from layers.
- **`geocoding`** — geocoding providers (GeoAdmin, Géonames, data.gouv.fr).
- **`elements`** — Lit web components (e.g. `SdkMapElement`) wrapping the OpenLayers renderer.

### Events

The renderer emits typed events defined in `packages/core/lib/model/events.ts` (`features-click`, `features-hover`, `map-click`, view/layer/extent state changes, layer error events). The OpenLayers `listen` utility wires these up.

## Conventions

- **ESM with explicit extensions**: imports use `.js` extensions (e.g. `import { ... } from "./style.js"`) even for `.ts` sources — enforced by the `import/extensions` ESLint rule, including for `ol/*` subpath imports. Keep this when adding imports.
- `@typescript-eslint/no-explicit-any` is a warning — avoid `any`; prefix intentionally-unused args with `_`.
- Tests are colocated as `*.test.ts` next to the code they cover and run under jsdom (canvas mocked via `vitest-canvas-mock`).
- TypeDoc reads JSDoc on the model types to generate the public API docs under `docs/api`; keep doc comments on exported model fields meaningful.
