[geospatial-sdk](../../index.md) / [core](../index.md) / MapContextLayerGeojson

# MapContextLayerGeojson

## Properties

### data?

```ts
data?: string | FeatureCollection<null | Geometry, GeoJsonProperties>;
```

#### Source

[packages/core/lib/model/map-context.ts:51](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/core/lib/model/map-context.ts#L51)

***

### extras?

```ts
extras?: LayerExtras;
```

This property can be used to store anything application-specific on layers; as its content may occasionally
be serialized to JSON for change detection purposes, it is not recommended to store Functions or other
non-serializable entities

#### Source

[packages/core/lib/model/map-context.ts:16](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/core/lib/model/map-context.ts#L16)

***

### id?

```ts
id?: string | number;
```

#### Source

[packages/core/lib/model/map-context.ts:8](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/core/lib/model/map-context.ts#L8)

***

### type

```ts
type: "geojson";
```

#### Source

[packages/core/lib/model/map-context.ts:47](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/core/lib/model/map-context.ts#L47)

***

### url?

```ts
url?: string;
```

#### Source

[packages/core/lib/model/map-context.ts:50](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/core/lib/model/map-context.ts#L50)

***

### version?

```ts
version?: number;
```

#### Source

[packages/core/lib/model/map-context.ts:9](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/core/lib/model/map-context.ts#L9)

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
