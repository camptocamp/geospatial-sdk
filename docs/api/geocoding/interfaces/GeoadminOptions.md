[geospatial-sdk](../../index.md) / [geocoding](../index.md) / GeoadminOptions

# GeoadminOptions

Reference documentation: https://api3.geo.admin.ch/services/sdiservices.html#search

## Properties

### features?

```ts
features?: string[];
```

A list of technical layer names; only applies when type is 'featuresearch'

#### Source

[packages/geocoding/lib/providers/geoadmin.provider.ts:32](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/geocoding/lib/providers/geoadmin.provider.ts#L32)

---

### lang?

```ts
lang?:
  | "it"
  | "de"
  | "fr"
  | "rm"
  | "en";
```

Default is 'en'

#### Source

[packages/geocoding/lib/providers/geoadmin.provider.ts:31](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/geocoding/lib/providers/geoadmin.provider.ts#L31)

---

### limit?

```ts
limit?: number;
```

Default value is 50 for 'locations', 20 for 'featuresearch', 30 for 'layers'

#### Source

[packages/geocoding/lib/providers/geoadmin.provider.ts:30](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/geocoding/lib/providers/geoadmin.provider.ts#L30)

---

### origins?

```ts
origins?: (
  | "address"
  | "zipcode"
  | "gg25"
  | "district"
  | "kantone"
  | "gazetteer"
  | "parcel")[];
```

Defaults to 'zipcode,gg25'; only applies when type is 'locations'

#### Source

[packages/geocoding/lib/providers/geoadmin.provider.ts:21](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/geocoding/lib/providers/geoadmin.provider.ts#L21)

---

### sr?

```ts
sr?: "21781" | "2056" | "4326" | "3857";
```

Defaults to 4326

#### Source

[packages/geocoding/lib/providers/geoadmin.provider.ts:20](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/geocoding/lib/providers/geoadmin.provider.ts#L20)

---

### type?

```ts
type?: "locations" | "featuresearch" | "layers";
```

Default is 'locations'

#### Source

[packages/geocoding/lib/providers/geoadmin.provider.ts:19](https://github.com/jahow/geospatial-sdk/blob/eda8b4f/packages/geocoding/lib/providers/geoadmin.provider.ts#L19)

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
