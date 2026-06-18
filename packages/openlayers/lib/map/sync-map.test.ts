import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MapContext } from "@geospatial-sdk/core";
import Map from "ol/Map.js";

let resolveCreate: (map: Map) => void;
const createMapFromContext = vi.fn();
const applyContextDiffToMap = vi.fn();

vi.mock("./create-map.js", () => ({
  createMapFromContext: (...args: unknown[]) => createMapFromContext(...args),
}));
vi.mock("./apply-context-diff.js", () => ({
  applyContextDiffToMap: (...args: unknown[]) => applyContextDiffToMap(...args),
}));
// Mock the diff so applyContextDiffToMap receives the target zoom directly,
// letting tests assert on apply order without depending on the diff's shape.
vi.mock("@geospatial-sdk/core", () => ({
  computeMapContextDiff: (next: MapContext) => ({
    zoom: (next.view as { zoom?: number }).zoom,
  }),
}));

const { syncMapWithContext } = await import("./sync-map.js");

function ctx(zoom: number): MapContext {
  return { view: { center: [0, 0], zoom }, layers: [] };
}

const fakeMap = {} as Map;

beforeEach(() => {
  createMapFromContext.mockReset();
  applyContextDiffToMap.mockReset();
  applyContextDiffToMap.mockResolvedValue(fakeMap);
  createMapFromContext.mockImplementation(
    () => new Promise<Map>((r) => (resolveCreate = r)),
  );
});

afterEach(() => vi.restoreAllMocks());

describe("syncMapWithContext", () => {
  it("applies the catch-up diff for a change that lands during creation", async () => {
    let current = ctx(2);
    const noopSubscribe = () => () => {};

    const promise = syncMapWithContext("t", () => current, noopSubscribe);
    // Context changes while createMapFromContext is still pending.
    current = ctx(5);
    resolveCreate(fakeMap);
    const handle = await promise;

    expect(handle.map).toBe(fakeMap);
    // The ctx(5) that landed during creation is caught up once the map is ready.
    expect(applyContextDiffToMap).toHaveBeenCalledTimes(1);
  });

  it("does not apply a catch-up when context is unchanged during creation", async () => {
    const current = ctx(2);
    const promise = syncMapWithContext(
      "t",
      () => current,
      () => () => {},
    );
    resolveCreate(fakeMap);
    await promise;
    expect(applyContextDiffToMap).not.toHaveBeenCalled();
  });

  it("serializes applies and preserves order on rapid changes", async () => {
    let current = ctx(2);
    let fire: () => void = () => {};
    const subscribe = (onChange: () => void) => {
      fire = onChange;
      return () => {};
    };

    const order: number[] = [];
    applyContextDiffToMap.mockImplementation((_m, diff) => {
      // diff carries the target context's zoom via the view change
      return Promise.resolve().then(() => {
        order.push((diff as { zoom?: number }).zoom ?? -1);
        return fakeMap;
      });
    });

    const promise = syncMapWithContext("t", () => current, subscribe);
    resolveCreate(fakeMap);
    await promise;

    // Two changes back-to-back before the chain drains.
    current = ctx(3);
    fire();
    current = ctx(4);
    fire();

    // let the chain settle
    await new Promise((r) => setTimeout(r));
    expect(applyContextDiffToMap).toHaveBeenCalledTimes(2);
    expect(order).toEqual([3, 4]);
  });

  it("stop() prevents further applies", async () => {
    let current = ctx(2);
    let fire: () => void = () => {};
    let unsubscribed = false;
    const subscribe = (onChange: () => void) => {
      fire = onChange;
      return () => (unsubscribed = true);
    };

    const promise = syncMapWithContext("t", () => current, subscribe);
    resolveCreate(fakeMap);
    const handle = await promise;

    handle.stop();
    current = ctx(9);
    fire();
    await new Promise((r) => setTimeout(r));

    expect(unsubscribed).toBe(true);
    expect(applyContextDiffToMap).not.toHaveBeenCalled();
  });
});
