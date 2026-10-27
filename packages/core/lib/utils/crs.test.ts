import proj4 from "proj4";
import {
  ensureContextCrsReady,
  ensureCrsRegistered,
  ensureDiffCrsReady,
  getContextCrsCodes,
  getDiffCrsCodes,
  getViewCrsCodes,
} from "./crs.js";
import { MapContextDiff } from "../model/map-context-diff.js";

const emptyDiff: MapContextDiff = {
  layersAdded: [],
  layersRemoved: [],
  layersChanged: [],
  layersReordered: [],
};

describe("crs utils", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("scanning", () => {
    it("scans a view", () => {
      expect(
        getViewCrsCodes({
          center: [1, 2, "EPSG:2154"],
          zoom: 3,
          projection: "EPSG:3857",
          maxExtent: [0, 0, 1, 1, "EPSG:32631"],
        }),
      ).toEqual(new Set(["EPSG:2154", "EPSG:3857", "EPSG:32631"]));
    });

    it("scans a context", () => {
      expect(
        getContextCrsCodes({
          layers: [],
          view: { extent: [0, 0, 1, 1, "EPSG:2154"], projection: "EPSG:3857" },
        }),
      ).toEqual(new Set(["EPSG:2154", "EPSG:3857"]));
      expect(getContextCrsCodes({ layers: [], view: null })).toEqual(new Set());
    });

    it("scans a diff", () => {
      expect(
        getDiffCrsCodes({
          ...emptyDiff,
          viewChanges: {
            center: [0, 0, "EPSG:2154"],
            zoom: 1,
            projection: "EPSG:3857",
          },
        }),
      ).toEqual(new Set(["EPSG:2154", "EPSG:3857"]));
      expect(getDiffCrsCodes(emptyDiff)).toEqual(new Set());
      expect(getDiffCrsCodes({ ...emptyDiff, viewChanges: null })).toEqual(
        new Set(),
      );
    });
  });

  describe("registration", () => {
    it("does not fetch known CRS", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      proj4.defs("EPSG:2154", "+proj=longlat +datum=WGS84 +no_defs");
      await ensureCrsRegistered(
        new Set(["EPSG:3857", "EPSG:4326", "EPSG:2154"]),
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fetches and registers a missing CRS", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("+proj=longlat +datum=WGS84 +no_defs"),
      });
      vi.stubGlobal("fetch", fetchMock);
      await ensureCrsRegistered(new Set(["EPSG:9999001"]));
      expect(fetchMock).toHaveBeenCalledWith(
        "https://spatialreference.org/ref/epsg/9999001/ogcwkt/",
      );
      expect(proj4.defs("EPSG:9999001")).toBeTruthy();
    });

    it("throws if the response is not ok", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 }),
      );
      await expect(
        ensureCrsRegistered(new Set(["EPSG:9999002"])),
      ).rejects.toThrow(/Could not find a definition for CRS "EPSG:9999002"/);
    });

    it("throws if the request fails", async () => {
      vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
      await expect(
        ensureCrsRegistered(new Set(["EPSG:9999003"])),
      ).rejects.toThrow(/EPSG:9999003.*offline/);
    });

    it("throws on an invalid code", async () => {
      await expect(ensureCrsRegistered(new Set(["foo"]))).rejects.toThrow(
        /Could not find a definition for CRS "foo"/,
      );
    });

    it("checks the CRS of a context and of a diff", async () => {
      vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
      await expect(
        ensureContextCrsReady({
          layers: [],
          view: { center: [0, 0], zoom: 1, projection: "EPSG:9999004" },
        }),
      ).rejects.toThrow(/EPSG:9999004/);
      await expect(
        ensureDiffCrsReady({
          ...emptyDiff,
          viewChanges: { center: [0, 0], zoom: 1, projection: "EPSG:9999005" },
        }),
      ).rejects.toThrow(/EPSG:9999005/);
      await expect(ensureDiffCrsReady(emptyDiff)).resolves.toBeUndefined();
    });
  });
});
