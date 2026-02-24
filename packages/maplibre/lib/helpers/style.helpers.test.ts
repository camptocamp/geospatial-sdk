import { describe, expect, it, vi } from "vitest";
import { contextStyleToMaplibreLayers } from "./style.helpers.js";

const defautlMaplibreFill = {
  type: "fill",
  paint: {
    "fill-color": "rgba(255,255,255,0.4)",
  },
  filter: ["==", "$type", "Polygon"],
};
const defaultMaplibreLine = {
  type: "line",
  paint: {
    "line-color": "#3399CC",
    "line-width": 1.25,
  },
};
const defaultMaplibreCircle = {
  type: "circle",
  filter: ["==", "$type", "Point"],
  paint: {
    "circle-color": "rgba(255,255,255,0.4)",
    "circle-radius": 5,
    "circle-stroke-color": "#3399CC",
    "circle-stroke-width": 1.25,
  },
};
const defaultMaplibreStyle = [
  defautlMaplibreFill,
  defaultMaplibreLine,
  defaultMaplibreCircle,
];

describe("createPaint", () => {
  it("return default layers when empty", () => {
    expect(contextStyleToMaplibreLayers({} as any)).toEqual(
      defaultMaplibreStyle,
    );
  });
  describe("Fill layer", () => {
    it("generates a fill layer", () => {
      const result = contextStyleToMaplibreLayers({
        "fill-color": "red",
      } as any);
      expect(result).toEqual([
        {
          filter: ["==", "$type", "Polygon"],
          type: "fill",
          paint: {
            "fill-color": "red",
          },
        },
        defaultMaplibreLine,
        defaultMaplibreCircle,
      ]);
    });
  });

  describe("Line layer", () => {
    it("generates a line layer if stroke-color is defined", () => {
      const result = contextStyleToMaplibreLayers({
        "stroke-color": "rgba(30, 67, 246, 0.5)",
        "stroke-width": 3,
      } as any);
      expect(result).toEqual([
        defautlMaplibreFill,
        {
          type: "line",
          paint: {
            "line-color": "rgba(30, 67, 246, 0.5)",
            "line-width": 3,
          },
        },
        defaultMaplibreCircle,
      ]);
    });

    it("Line stroke width", () => {
      const result = contextStyleToMaplibreLayers({ "stroke-width": 3 } as any);
      expect(result[1]).toEqual({
        type: "line",
        paint: {
          "line-color": "#3399CC",
          "line-width": 3,
        },
      });
    });

    it("Line dash array", () => {
      const result = contextStyleToMaplibreLayers({
        "stroke-color": "red",
        "stroke-line-dash": [2, 4],
      } as any);
      expect(result[1]).toEqual({
        type: "line",
        paint: {
          "line-color": "red",
          "line-dasharray": [2, 4],
          "line-width": 1.25,
        },
      });
    });
  });

  describe("Circle layer", () => {
    it("generates a circle layer with fill and stroke colors and stroke width", () => {
      const style = {
        "circle-radius": 10,
        "circle-fill-color": "red",
        "circle-stroke-color": "blue",
        "circle-stroke-width": 2,
      };

      const result = contextStyleToMaplibreLayers(style as any);

      expect(result).toEqual([
        defautlMaplibreFill,
        defaultMaplibreLine,
        {
          type: "circle",
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 10,
            "circle-color": "red",
            "circle-stroke-color": "blue",
            "circle-stroke-width": 2,
          },
        },
      ]);
    });

    it("generates a circle layer with only radius if no colors are provided", () => {
      const style = {
        "circle-radius": 5,
      };

      const result = contextStyleToMaplibreLayers(style as any);

      expect(result[2].paint).toEqual({
        "circle-color": "rgba(255,255,255,0.4)",
        "circle-radius": 5,
        "circle-stroke-color": "#3399CC",
        "circle-stroke-width": 1.25,
      });
    });

    it("respects colors and opacity", () => {
      const style = {
        "circle-radius": 8,
        "circle-fill-color": "rgba(255,0,0,0.3)",
        "circle-stroke-color": "rgba(0,0,255,0.6)",
      };

      const result = contextStyleToMaplibreLayers(style as any);

      expect(result[2].paint["circle-color"]).toBe("rgba(255,0,0,0.3)"); // mocked
      expect(result[2].paint["circle-stroke-color"]).toBe("rgba(0,0,255,0.6)"); // mocked
    });
  });

  describe("Expression handling", () => {
    it("passes through simple expressions like ['get', 'color']", () => {
      const result = contextStyleToMaplibreLayers({
        "fill-color": ["get", "color"],
      } as any);
      expect(result[0].paint["fill-color"]).toEqual(["get", "color"]);
    });

    it("passes through interpolate expressions", () => {
      const expr = ["interpolate", ["linear"], ["zoom"], 0, 1, 10, 5];
      const result = contextStyleToMaplibreLayers({
        "stroke-width": expr,
      } as any);
      expect(result[1].paint["line-width"]).toEqual([
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        1,
        10,
        5,
      ]);
    });

    it("passes through match expressions", () => {
      const expr = ["match", ["get", "type"], "road", "red", "blue"];
      const result = contextStyleToMaplibreLayers({
        "stroke-color": expr,
      } as any);
      expect(result[1].paint["line-color"]).toEqual([
        "match",
        ["get", "type"],
        "road",
        "red",
        "blue",
      ]);
    });

    it("converts 'color' with 3 args to 'rgb'", () => {
      const result = contextStyleToMaplibreLayers({
        "fill-color": ["color", 255, 0, 0],
      } as any);
      expect(result[0].paint["fill-color"]).toEqual(["rgb", 255, 0, 0]);
    });

    it("converts 'color' with 4 args to 'rgba'", () => {
      const result = contextStyleToMaplibreLayers({
        "fill-color": ["color", 255, 0, 0, 0.5],
      } as any);
      expect(result[0].paint["fill-color"]).toEqual(["rgba", 255, 0, 0, 0.5]);
    });

    it("converts 'number' to 'to-number'", () => {
      const result = contextStyleToMaplibreLayers({
        "stroke-width": ["number", ["get", "width"]],
      } as any);
      expect(result[1].paint["line-width"]).toEqual([
        "to-number",
        ["get", "width"],
      ]);
    });

    it("converts 'between' to 'all' with >= and <=", () => {
      const result = contextStyleToMaplibreLayers({
        "circle-radius": ["between", ["get", "val"], 0, 10],
      } as any);
      expect(result[2].paint["circle-radius"]).toEqual([
        "all",
        [">=", ["get", "val"], 0],
        ["<=", ["get", "val"], 10],
      ]);
    });

    it("handles nested expressions (case with color sub-expressions)", () => {
      const expr = [
        "case",
        ["get", "active"],
        ["color", 0, 255, 0],
        ["color", 255, 0, 0],
      ];
      const result = contextStyleToMaplibreLayers({
        "fill-color": expr,
      } as any);
      expect(result[0].paint["fill-color"]).toEqual([
        "case",
        ["get", "active"],
        ["rgb", 0, 255, 0],
        ["rgb", 255, 0, 0],
      ]);
    });

    it("still works with literal values (regression)", () => {
      const result = contextStyleToMaplibreLayers({
        "fill-color": "red",
        "stroke-width": 3,
      } as any);
      expect(result[0].paint["fill-color"]).toBe("red");
      expect(result[1].paint["line-width"]).toBe(3);
    });

    it("does not treat numeric arrays as expressions", () => {
      const result = contextStyleToMaplibreLayers({
        "stroke-color": "red",
        "stroke-line-dash": [2, 4],
      } as any);
      expect(result[1].paint["line-dasharray"]).toEqual([2, 4]);
    });

    it("warns on unsupported operators like 'resolution'", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = contextStyleToMaplibreLayers({
        "fill-color": ["resolution"],
      } as any);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("resolution"),
      );
      expect(result[0].paint["fill-color"]).toBeUndefined();
      warnSpy.mockRestore();
    });
  });
});
