import { describe, expect, it, vi } from "vitest";
import { openLayersStyleToMapLibreLayers } from "./maplibre.converter.js";
import { defaultStyle } from "@geospatial-sdk/core";
import type { LayerSpecification } from "maplibre-gl";
import type { FlatStyleLike } from "ol/style/flat.js";

describe("openLayersStyleToMapLibreLayers", () => {
  const testCases: Array<{
    name: string;
    input: FlatStyleLike;
    expected: Partial<LayerSpecification>[];
  }> = [
    {
      name: "generates a fill layer",
      input: {
        "fill-color": "red",
      },
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": "red",
          },
          filter: ["==", ["geometry-type"], "Polygon"],
        },
      ],
    },
    {
      name: "generates a line layer if stroke-color is defined",
      input: {
        "stroke-color": "rgba(30, 67, 246, 0.5)",
        "stroke-width": 3,
      },
      expected: [
        {
          type: "line",
          paint: {
            "line-color": "rgba(30, 67, 246, 0.5)",
            "line-width": 3,
          },
        },
      ],
    },
    {
      name: "Line stroke width",
      input: { "stroke-width": 3 },
      expected: [
        {
          type: "line",
          paint: {
            "line-color": "rgb(51,153,204)",
            "line-width": 3,
          },
        },
      ],
    },
    {
      name: "Line dash array",
      input: {
        "stroke-color": "red",
        "stroke-line-dash": [2, 4],
      },
      expected: [
        {
          type: "line",
          paint: {
            "line-color": "red",
            "line-dasharray": [2, 4],
            "line-width": 1.25,
          },
        },
      ],
    },
    {
      name: "generates a circle layer with fill and stroke colors and stroke width",
      input: {
        "circle-radius": 10,
        "circle-fill-color": "red",
        "circle-stroke-color": "blue",
        "circle-stroke-width": 2,
      },
      expected: [
        {
          type: "circle",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 10,
            "circle-color": "red",
            "circle-stroke-color": "blue",
            "circle-stroke-width": 2,
          },
        },
      ],
    },
    {
      name: "generates a circle layer with only radius if no colors are provided",
      input: {
        "circle-radius": 5,
      },
      expected: [
        {
          type: "circle",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-color": "rgba(255,255,255,0.4)",
            "circle-radius": 5,
          },
        },
      ],
    },
    {
      name: "respects colors and opacity",
      input: {
        "circle-radius": 8,
        "circle-fill-color": "rgba(255,0,0,0.3)",
        "circle-stroke-color": "rgba(0,0,255,0.6)",
      },
      expected: [
        {
          type: "circle",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 8,
            "circle-color": "rgba(255,0,0,0.3)",
            "circle-stroke-color": "rgba(0,0,255,0.6)",
            "circle-stroke-width": 1.25,
          },
        },
      ],
    },
    {
      name: "passes through simple expressions like ['get', 'color']",
      input: {
        "fill-color": ["get", "color"],
      },
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": ["get", "color"],
          },
          filter: ["==", ["geometry-type"], "Polygon"],
        },
      ],
    },
    {
      name: "passes through interpolate expressions",
      input: {
        "stroke-width": ["interpolate", ["linear"], ["zoom"], 0, 1, 10, 5],
      },
      expected: [
        {
          type: "line",
          paint: {
            "line-color": "rgb(51,153,204)",
            "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1, 10, 5],
          },
        },
      ],
    },
    {
      name: "passes through match expressions",
      input: {
        "stroke-color": ["match", ["get", "type"], "road", "red", "blue"],
      },
      expected: [
        {
          type: "line",
          paint: {
            "line-width": 1.25,
            "line-color": ["match", ["get", "type"], "road", "red", "blue"],
          },
        },
      ],
    },
    {
      name: "converts 'color' with 3 args to 'rgb'",
      input: {
        "fill-color": ["color", 255, 0, 0],
      },
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": ["rgb", 255, 0, 0],
          },
          filter: ["==", ["geometry-type"], "Polygon"],
        },
      ],
    },
    {
      name: "converts 'color' with 4 args to 'rgba'",
      input: {
        "fill-color": ["color", 255, 0, 0, 0.5],
      },
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": ["rgba", 255, 0, 0, 0.5],
          },
          filter: ["==", ["geometry-type"], "Polygon"],
        },
      ],
    },
    {
      name: "converts 'number' to 'to-number'",
      input: {
        "stroke-width": ["number", ["get", "width"]],
      },
      expected: [
        {
          type: "line",
          paint: {
            "line-color": "rgb(51,153,204)",
            "line-width": ["to-number", ["get", "width"]],
          },
        },
      ],
    },
    {
      name: "converts 'between' to 'all' with >= and <=",
      input: {
        "circle-radius": ["between", ["get", "val"], 0, 10],
      },
      expected: [
        {
          type: "circle",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": [
              "all",
              [">=", ["get", "val"], 0],
              ["<=", ["get", "val"], 10],
            ],
            "circle-color": "rgba(255,255,255,0.4)",
          },
        },
      ],
    },
    {
      name: "handles nested expressions (case with color sub-expressions)",
      input: {
        "fill-color": [
          "case",
          ["get", "active"],
          ["color", 0, 255, 0],
          ["color", 255, 0, 0],
        ],
      },
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": [
              "case",
              ["get", "active"],
              ["rgb", 0, 255, 0],
              ["rgb", 255, 0, 0],
            ],
          },
          filter: ["==", ["geometry-type"], "Polygon"],
        },
      ],
    },
    {
      name: "still works with literal values (regression)",
      input: {
        "fill-color": "red",
        "stroke-width": 3,
      },
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": "red",
          },
          filter: ["==", ["geometry-type"], "Polygon"],
        },
        {
          type: "line",
          paint: {
            "line-color": "rgb(51,153,204)",
            "line-width": 3,
          },
        },
      ],
    },
    {
      name: "does not treat numeric arrays as expressions",
      input: {
        "stroke-color": "red",
        "stroke-line-dash": [2, 4],
      },
      expected: [
        {
          type: "line",
          paint: {
            "line-color": "red",
            "line-dasharray": [2, 4],
            "line-width": 1.25,
          },
        },
      ],
    },
    {
      name: "converts the default style",
      input: defaultStyle,
      expected: [
        {
          paint: {
            "line-color": "white",
            "line-width": 6,
          },
          type: "line",
          filter: ["==", ["geometry-type"], "LineString"],
        },
        {
          paint: {
            "line-color": "rgb(0, 0, 255)",
            "line-width": 2,
          },
          type: "line",
          filter: ["==", ["geometry-type"], "LineString"],
        },
        {
          paint: {
            "fill-color": "rgba(0,0,255,0.25)",
          },
          type: "fill",
          filter: ["==", ["geometry-type"], "Polygon"],
        },
        {
          paint: {
            "line-color": "white",
            "line-width": 2,
          },
          type: "line",
          filter: ["==", ["geometry-type"], "Polygon"],
        },
        {
          paint: {
            "circle-color": "rgb(0, 0, 255)",
            "circle-radius": 7,
            "circle-stroke-color": "white",
            "circle-stroke-width": 2,
          },
          type: "circle",
          filter: ["==", ["geometry-type"], "Point"],
        },
      ],
    },
    {
      name: "handles flat style array with multiple rules (multiple styles)",
      input: [
        {
          "fill-color": "red",
        },
        {
          "stroke-color": "blue",
          "stroke-width": 2,
        },
      ],
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": "red",
          },
          filter: ["==", ["geometry-type"], "Polygon"],
        },
        {
          type: "line",
          paint: {
            "line-color": "blue",
            "line-width": 2,
          },
        },
      ],
    },
    {
      name: "handles flat style with filter (rule with style property)",
      input: [
        {
          filter: ["==", ["get", "type"], "water"],
          style: {
            "fill-color": "blue",
          },
        },
      ],
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": "blue",
          },
          filter: [
            "all",
            ["==", ["get", "type"], "water"],
            ["==", ["geometry-type"], "Polygon"],
          ],
        },
      ],
    },
    {
      name: "handles multiple rules with filters",
      input: [
        {
          filter: ["==", ["get", "type"], "water"],
          style: {
            "fill-color": "blue",
          },
        },
        {
          filter: ["==", ["get", "type"], "forest"],
          style: {
            "fill-color": "green",
          },
        },
      ],
      expected: [
        {
          filter: [
            "all",
            ["==", ["get", "type"], "water"],
            ["==", ["geometry-type"], "Polygon"],
          ],
          paint: {
            "fill-color": "blue",
          },
          type: "fill",
        },
        {
          filter: [
            "all",
            ["==", ["get", "type"], "forest"],
            ["==", ["geometry-type"], "Polygon"],
          ],
          paint: {
            "fill-color": "green",
          },
          type: "fill",
        },
      ],
    },
    {
      name: "handles rule with style containing multiple layer types",
      input: [
        {
          filter: ["==", ["get", "type"], "road"],
          style: {
            "fill-color": "gray",
            "stroke-color": "black",
            "stroke-width": 3,
          },
        },
      ],
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": "gray",
          },
          filter: [
            "all",
            ["==", ["get", "type"], "road"],
            ["==", ["geometry-type"], "Polygon"],
          ],
        },
        {
          type: "line",
          paint: {
            "line-color": "black",
            "line-width": 3,
          },
          filter: ["==", ["get", "type"], "road"],
        },
      ],
    },
    {
      name: "handles rule with complex filter and expression-based style",
      input: [
        {
          filter: [">=", ["get", "population"], 10000],
          style: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "density"],
              0,
              "green",
              100,
              "red",
            ],
            "stroke-width": ["case", ["get", "capital"], 3, 1],
          },
        },
      ],
      expected: [
        {
          type: "fill",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "density"],
              0,
              "green",
              100,
              "red",
            ],
          },
          filter: [
            "all",
            [">=", ["get", "population"], 10000],
            ["==", ["geometry-type"], "Polygon"],
          ],
        },
        {
          type: "line",
          paint: {
            "line-color": "rgb(51,153,204)",
            "line-width": ["case", ["get", "capital"], 3, 1],
          },
          filter: [">=", ["get", "population"], 10000],
        },
      ],
    },
  ];

  testCases.forEach(({ name, input, expected }) => {
    it(name, () => {
      const result = openLayersStyleToMapLibreLayers(input);
      expect(result).toEqual(expected);
    });
  });

  it("warns on unsupported operators like 'resolution'", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = openLayersStyleToMapLibreLayers({
      "fill-color": ["resolution"],
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("resolution"));
    expect(result).toEqual([
      {
        type: "fill",
        paint: {
          "fill-color": undefined,
        },
        filter: ["==", ["geometry-type"], "Polygon"],
      },
    ]);
    warnSpy.mockRestore();
  });
});
