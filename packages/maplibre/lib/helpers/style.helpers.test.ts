import { describe, expect, it } from "vitest";
import { contextStyleToMaplibreLayers } from "./style.helpers";

describe("createPaint", () => {
  it("retourne un tableau vide si style ne contient rien", () => {
    expect(contextStyleToMaplibreLayers({} as any)).toEqual([]);
  });
  describe("Fill layer", () => {
    it("generates a fill layer", () => {
      const result = contextStyleToMaplibreLayers({ "fill-color": "red" } as any);
      expect(result).toEqual([
        {
          type: "fill",
          paint: {
            "fill-color": "#ff0000",
          },
        },
      ]);
    });
  });

  describe("Line layer", () => {
    it("génère un layer line si stroke-color est défini", () => {
      const result = contextStyleToMaplibreLayers({
        "stroke-color": "rgba(30, 67, 246, 0.5)",
        "stroke-width": 3,
      } as any);
      expect(result).toEqual([
        {
          type: "line",
          paint: {
            "line-opacity": 0.5,
            "line-color": "#1e43f6",
            "line-width": 3,
          },
        },
      ]);
    });

    it("génère un layer line si stroke-width est défini", () => {
      const result = contextStyleToMaplibreLayers({ "stroke-width": 3 } as any);
      expect(result).toEqual([
        {
          type: "line",
          paint: {
            "line-width": 3,
          },
        },
      ]);
    });

    it("génère un layer line avec dasharray si stroke-line-dash est défini", () => {
      const result = contextStyleToMaplibreLayers({
        "stroke-color": "red",
        "stroke-line-dash": [2, 4],
      } as any);
      expect(result).toEqual([
        {
          type: "line",
          paint: {
            "line-color": "#ff0000",
            "line-dasharray": [2, 4],
          },
        },
      ]);
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
        {
          type: "circle",
          paint: {
            "circle-radius": 10,
            "circle-color": "#ff0000",
            "circle-stroke-color": "#0000ff",
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

      expect(result).toEqual([
        {
          type: "circle",
          paint: {
            "circle-radius": 5,
            "circle-stroke-width": undefined,
          },
        },
      ]);
    });

    it("respects opacity from createColor for fill and stroke", () => {
      const style = {
        "circle-radius": 8,
        "circle-fill-color": "rgba(255,0,0,0.3)",
        "circle-stroke-color": "rgba(0,0,255,0.6)",
      };

      const result = contextStyleToMaplibreLayers(style as any);

      expect(result[0].paint["circle-opacity"]).toBe(0.3); // mocked
      expect(result[0].paint["circle-stroke-opacity"]).toBe(0.6); // mocked
    });
  });

  it("combines fill & line and creates 2 layers", () => {
    const result = contextStyleToMaplibreLayers({
      "fill-color": "red",
      "stroke-color": "blue",
      "stroke-width": 2,
      "stroke-line-dash": [1, 1],
    } as any);

    expect(result).toEqual([
      {
        type: "fill",
        paint: {
          "fill-color": "#ff0000",
        },
      },
      {
        type: "line",
        paint: {
          "line-color": "#0000ff",
          "line-width": 2,
          "line-dasharray": [1, 1],
        },
      },
    ]);
  });

  it("aplati un tableau de styles", () => {
    const styles = [{ "fill-color": "red" }, { "stroke-width": 2 }] as any;
    const result = contextStyleToMaplibreLayers(styles);
    expect(result.length).toBe(2);
    expect(result[0].type).toBe("fill");
    expect(result[1].type).toBe("line");
  });
});
