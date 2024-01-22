[@camptocamp/geospatial-sdk](../../index.md) / [geocoding](../index.md) / GeoadminOptions

# GeoadminOptions

```ts
type GeoadminOptions: Object;
```

Reference documentation: https://api3.geo.admin.ch/services/sdiservices.html#search

## Type declaration

### features?

```ts
features?: string[];
```

### lang?

```ts
lang?: 
  | "de"
  | "fr"
  | "it"
  | "rm"
  | "en";
```

### limit?

```ts
limit?: number;
```

### origins?

```ts
origins?: (
  | "zipcode"
  | "gg25"
  | "district"
  | "kantone"
  | "gazetteer"
  | "address"
  | "parcel")[];
```

### sr?

```ts
sr?: "21781" | "2056" | "4326" | "3857";
```

### type?

```ts
type?: "locations" | "featuresearch" | "layers";
```

## Source

[packages/geocoding/lib/providers/geoadmin.provider.ts:21](https://github.com/jahow/geospatial-sdk/blob/b3c3686/packages/geocoding/lib/providers/geoadmin.provider.ts#L21)

***

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
