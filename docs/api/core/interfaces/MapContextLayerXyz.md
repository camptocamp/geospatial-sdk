[@camptocamp/geospatial-sdk](../../index.md) / [core](../index.md) / MapContextLayerXyz

# MapContextLayerXyz

## Extends

- [`MapContextBaseLayer`](../type-aliases/MapContextBaseLayer.md)

## Properties

### extras?

```ts
extras?: LayerExtras;
```

This property can be used to store anything application-specific on layers; as its content may occasionally
be serialized to JSON for change detection purposes, it is not recommended to store Functions or other
non-serializable entities

#### Inherited from

`MapContextBaseLayer.extras`

#### Source

[packages/core/lib/model/map-context.ts:16](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/core/lib/model/map-context.ts#L16)

***

### id?

```ts
id?: string | number;
```

#### Inherited from

`MapContextBaseLayer.id`

#### Source

[packages/core/lib/model/map-context.ts:8](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/core/lib/model/map-context.ts#L8)

***

### type

```ts
type: "xyz";
```

#### Source

[packages/core/lib/model/map-context.ts:42](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/core/lib/model/map-context.ts#L42)

***

### url

```ts
url: string;
```

#### Source

[packages/core/lib/model/map-context.ts:43](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/core/lib/model/map-context.ts#L43)

***

### version?

```ts
version?: number;
```

#### Inherited from

`MapContextBaseLayer.version`

#### Source

[packages/core/lib/model/map-context.ts:9](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/core/lib/model/map-context.ts#L9)

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
