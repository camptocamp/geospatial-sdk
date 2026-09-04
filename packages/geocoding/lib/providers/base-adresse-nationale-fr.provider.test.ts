import { GeocodingResult } from "../model/index.js";
import { queryBaseAdresseNationale } from "./base-adresse-nationale-fr.provider.js";

interface FixtureFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

interface DataGeopfFrFixtureResponse {
  type: "FeatureCollection";
  query: string;
  features: FixtureFeature[];
}

function poiFeature(
  properties: Partial<FixtureFeature["properties"]> = {},
): FixtureFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [6.607922, 45.688166] },
    properties: {
      _type: "poi",
      toponym: "Beaufort",
      category: ["administratif", "commune"],
      citycode: ["73034"],
      truegeometry: '{"type":"Point","coordinates":[6.607922,45.688166]}',
      ...properties,
    },
  };
}

function addressFeature(
  properties: Partial<FixtureFeature["properties"]> = {},
): FixtureFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [2.424573, 48.845726] },
    properties: {
      _type: "address",
      label: "73 Avenue de Paris 94160 Saint-Mandé",
      postcode: "94160",
      citycode: "94067",
      city: "Saint-Mandé",
      street: "Avenue de Paris",
      housenumber: "73",
      ...properties,
    },
  };
}

function parcelFeature(
  properties: Partial<FixtureFeature["properties"]> = {},
): FixtureFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [2.4162, 48.8471] },
    properties: {
      _type: "parcel",
      section: "0A",
      number: "0001",
      city: "Saint-Mandé",
      truegeometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.4162, 48.8471],
            [2.4163, 48.8472],
            [2.4162, 48.8471],
          ],
        ],
      },
      ...properties,
    },
  };
}

function mockFetch(response: DataGeopfFrFixtureResponse) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve(response) } as Response),
  );
}

describe("queryBaseAdresseNationale", () => {
  let results: GeocodingResult[];

  it("parses a poi feature, excluding toponym/truegeometry (already exposed as label/geom)", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "beaufort",
      features: [poiFeature()],
    });
    results = await queryBaseAdresseNationale("beaufort");
    expect(results).toEqual([
      {
        label: "Beaufort",
        properties: {
          _type: "poi",
          category: ["administratif", "commune"],
          citycode: ["73034"],
        },
        geom: { type: "Point", coordinates: [6.607922, 45.688166] },
      },
    ]);
  });

  it("parses the poi true geometry when returnTrueGeometry is enabled", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "beaufort",
      features: [poiFeature()],
    });
    results = await queryBaseAdresseNationale("beaufort", {
      returnTrueGeometry: true,
    });
    expect(results[0].geom).toEqual({
      type: "Point",
      coordinates: [6.607922, 45.688166],
    });
  });

  it("parses an address feature, excluding label (already exposed as label); ignores returnTrueGeometry (no true geometry available)", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "73 avenue de paris",
      features: [addressFeature()],
    });
    results = await queryBaseAdresseNationale("73 avenue de paris", {
      index: ["address"],
      returnTrueGeometry: true,
    });
    expect(results).toEqual([
      {
        label: "73 Avenue de Paris 94160 Saint-Mandé",
        properties: {
          _type: "address",
          postcode: "94160",
          citycode: "94067",
          city: "Saint-Mandé",
          street: "Avenue de Paris",
          housenumber: "73",
        },
        geom: { type: "Point", coordinates: [2.424573, 48.845726] },
      },
    ]);
  });

  it("parses a parcel feature, synthesizing a label from section/number/city", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "0A 0001",
      features: [parcelFeature()],
    });
    results = await queryBaseAdresseNationale("0A 0001", {
      index: ["parcel"],
    });
    expect(results).toEqual([
      {
        label: "0A 0001, Saint-Mandé",
        properties: {
          _type: "parcel",
          section: "0A",
          number: "0001",
          city: "Saint-Mandé",
        },
        geom: { type: "Point", coordinates: [2.4162, 48.8471] },
      },
    ]);
  });

  it("parses the parcel true geometry when returnTrueGeometry is enabled", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "0A 0001",
      features: [parcelFeature()],
    });
    results = await queryBaseAdresseNationale("0A 0001", {
      index: ["parcel"],
      returnTrueGeometry: true,
    });
    expect(results[0].geom).toEqual({
      type: "Polygon",
      coordinates: [
        [
          [2.4162, 48.8471],
          [2.4163, 48.8472],
          [2.4162, 48.8471],
        ],
      ],
    });
  });

  it("parses a mixed poi/address response, dispatching per feature", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "beaufort",
      features: [poiFeature(), addressFeature()],
    });
    results = await queryBaseAdresseNationale("beaufort", {
      index: ["poi", "address"],
    });
    expect(results.map((r) => r.label)).toEqual([
      "Beaufort",
      "73 Avenue de Paris 94160 Saint-Mandé",
    ]);
  });

  it("uses fixed defaults (autocomplete only, no index override)", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "beaufort",
      features: [poiFeature()],
    });
    await queryBaseAdresseNationale("beaufort");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://data.geopf.fr/geocodage/search?q=beaufort&autocomplete=1",
    );
  });

  it("uses given options, joining array values with commas", async () => {
    mockFetch({
      type: "FeatureCollection",
      query: "beaufort",
      features: [poiFeature(), addressFeature()],
    });
    await queryBaseAdresseNationale("beaufort", {
      index: ["poi", "address"],
      category: ["hydrographie", "transport"],
      type: ["housenumber", "street"],
      limit: 5,
      postCode: ["73270", "73000"],
      cityCode: ["73034"],
      depCode: ["73", "74"],
      returnTrueGeometry: true,
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://data.geopf.fr/geocodage/search?q=beaufort&autocomplete=1&index=poi%2Caddress&returntruegeometry=true&category=hydrographie%2Ctransport&type=housenumber%2Cstreet&limit=5&postcode=73270%2C73000&citycode=73034&depcode=73%2C74",
    );
  });
});
