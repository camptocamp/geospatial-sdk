[@camptocamp/geospatial-sdk](../../index.md) / [core](../index.md) / MapContextBaseLayer

# MapContextBaseLayer

```ts
type MapContextBaseLayer: Object;
```

## Type declaration

### extras?

```ts
extras?: LayerExtras;
```

This property can be used to store anything application-specific on layers; as its content may occasionally
be serialized to JSON for change detection purposes, it is not recommended to store Functions or other
non-serializable entities

### id?

```ts
id?: string | number;
```

### version?

```ts
version?: number;
```

## Source

[packages/core/lib/model/map-context.ts:7](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/core/lib/model/map-context.ts#L7)

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
