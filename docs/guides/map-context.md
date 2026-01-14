---
outline: deep
editLink: true
lastUpdated: true
---

# Map Context

A **Map Context** is a plain JavaScript object that declaratively describes a map's state: its layers and view. This makes maps serializable, framework-agnostic, and easy to manage in application state.

```typescript
interface MapContext {
  layers: MapContextLayer[]
  view: MapContextView | null
}
```

## Layers

Each layer has a `type` property that determines its data source:

- **`xyz`**: Tiles (raster or vector) aligned on the global Web Mercator grid (EPSG:3857) (`url`)
- **`wms`**: OGC Web Map Service (`url`, `name`, optional `dimensions`, `style`)
- **`wmts`**: OGC Web Map Tile Service (`url`, `name`, optional `dimensions`, `style`)
- **`wfs`**: OGC Web Feature Service (`url`, `featureType`, optional `style`)
- **`geojson`**: Vector data in GeoJSON format (`url` or `data`, optional `style`)
- **`ogcapi`**: OGC API, supports Features and Tiles (both raster and vector) (`url`, `collection`, optional `useTiles`, `tileMatrixSet`, `style`)
- **`maplibre-style`**: MapLibre Style Spec (`styleUrl`, optional `accessToken`)

Other options include `id` and `version` (see chapter below), `label`, `visibility` (hidden or not), `opacity` and `attributions`.

See the API doc for [`MapContextLayer`](../api/core/lib/interfaces/MapContextLayer.html) and derived classes.

Note: all layers derive from the [`MapContextBaseLayer`](../api/core/lib/interfaces/MapContextBaseLayer.html) interface.

### Layer Identification

All layers have two optional properties for identification:
- **`id`**: A unique identifier, string or numeric; if provided, will be used to track the layer across context updates.
- **`version`**: A number that indicates whether the layer was changed.

What this means is that _using an `id` for layers is optional, and changes the way the application code works_:
* with an `id`, layers will be persistent across context updates and their version number should be incremented regularly by the application code;
* without `id`, layers will simply be recreated whenever they change without consideration for persistence.

|                | ✅ Pros                                                                 | 🚩 Cons                                                                                           |
|----------------|------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Using `id`     | Map layers can be updated without being recreated (better performance) | The application has to generate them or ask the user to input them and make sure they are unique! |
| Not using `id` | The map context is easier to generate (one less field necessary)       | Map layers will have to be recreated each time a property on the layer object changes             |
  

### Vector Styles

The vector layers take a `style` property for their symbology. They use the so-called [_OpenLayers flat style format_ (see API doc)](https://openlayers.org/en/latest/apidoc/module-ol_style_flat.html).

This property is optional; if not provided, a default style will be used (depending on the library).

### Extras

All layer types can take an optional `extras` property, which is a free object that can contain any application-specific information. The SDK will mostly ignore this property.

::: warning

Please note that this property might be serialized to JSON and thus should not contain circular references, otherwise errors will be thrown!
:::

### Attributions

Layers' attributions will be shown on the map when they are provided. **They are not mandatory but strongly encouraged.** Remember to attribute your map properly!

## View

Define the map position in one of three ways:

```typescript
// By center and zoom
{ center: [lon, lat], zoom: 10 }

// By extent
{ extent: [minX, minY, maxX, maxY] }

// By geometry
{ geometry: { type: 'Polygon', coordinates: [...] }}
```

Other options include `maxZoom` and `maxExtent`.

See the API doc for [`MapContextView`](../api/core/lib/type-aliases/MapContextView.html).

### Default view

The `view` property of the map context can be left to `null`; in that case, a default global view will be used.

## Creating Maps

```typescript
import { createMapFromContext } from '@geospatial-sdk/openlayers'

const context = {
  layers: [{ type: 'xyz', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' }],
  view: { center: [0, 0], zoom: 2 }
}

const map = await createMapFromContext(context, document.getElementById('map'))
```

## Manipulating Contexts

Use immutable utilities from `@geospatial-sdk/core`:

```typescript
import { 
  addLayerToContext, 
  removeLayerFromContext,
  replaceLayerInContext,
  changeLayerPositionInContext,
  getLayerPosition 
} from '@geospatial-sdk/core'

const newContext = addLayerToContext(context, layer, position)
```

Each of these utilities will produce a new object without mutating the original context.

## Comparing contexts

See the [Map Context Diff](./map-context-diff) guide.
