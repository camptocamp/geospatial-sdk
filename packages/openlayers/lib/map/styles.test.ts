import chroma from "chroma-js";
import Style, { StyleFunction } from "ol/style/Style.js";
import Feature from "ol/Feature.js";
import { LineString, Point, Polygon } from "ol/geom.js";
import {
  createGeometryStyles,
  createStyleFunction,
  defaultHighlightStyle,
  defaultStyle,
  StyleByGeometryType,
} from "./styles.js";
import CircleStyle from "ol/style/Circle.js";

describe("MapStyleService", () => {
  describe("#createGeometryStyles", () => {
    let styles: StyleByGeometryType;
    let pointStyle: Style;
    let lineStyle: Style[];
    let polygonStyle: Style;

    describe("unfocused style", () => {
      beforeEach(() => {
        const options = {
          color: "orange",
        };
        styles = createGeometryStyles(options);
        pointStyle = styles.point as Style;
        lineStyle = styles.line as Style[];
        polygonStyle = styles.polygon as Style;
      });
      describe("point style", () => {
        it("has 1 style", () => {
          expect(pointStyle).toBeInstanceOf(Style);
        });
        it("has correct radius", () => {
          expect((pointStyle.getImage() as CircleStyle)?.getRadius()).toBe(7);
        });
        it("has correct fill color", () => {
          expect(
            (pointStyle.getImage() as CircleStyle)?.getFill()?.getColor(),
          ).toBe("orange");
        });
        it("has correct stroke color and width", () => {
          expect(
            (pointStyle.getImage() as CircleStyle)?.getStroke()?.getColor(),
          ).toBe("white");
          expect(
            (pointStyle.getImage() as CircleStyle)?.getStroke()?.getWidth(),
          ).toBe(2);
        });
      });
      describe("polygon style", () => {
        it("has 1 style", () => {
          expect(polygonStyle).toBeInstanceOf(Style);
        });
        it("has correct fill color", () => {
          expect(polygonStyle.getFill()?.getColor()).toBe(
            chroma("orange").alpha(0.25).css(),
          );
        });
        it("has correct stroke color and width", () => {
          expect(polygonStyle.getStroke()?.getColor()).toBe("white");
          expect(polygonStyle.getStroke()?.getWidth()).toBe(2);
        });
      });
      describe("line style", () => {
        it("has 2 styles", () => {
          expect(lineStyle).toEqual([expect.any(Style), expect.any(Style)]);
        });
        it("has correct color (back stroke)", () => {
          expect(lineStyle[0].getStroke()?.getColor()).toBe("white");
        });
        it("has correct width (back stroke)", () => {
          expect(lineStyle[0].getStroke()?.getWidth()).toBe(6);
        });
        it("has correct color (front stroke)", () => {
          expect(lineStyle[1].getStroke()?.getColor()).toBe("orange");
        });
        it("has correct width (front stroke)", () => {
          expect(lineStyle[1].getStroke()?.getWidth()).toBe(2);
        });
      });
    });
    describe("focused style", () => {
      beforeEach(() => {
        const options = {
          color: "pink",
          isFocused: true,
        };
        styles = createGeometryStyles(options);
        pointStyle = styles.point as Style;
        lineStyle = styles.line as Style[];
        polygonStyle = styles.polygon as Style;
      });
      describe("point style", () => {
        it("has correct radius", () => {
          expect((pointStyle.getImage() as CircleStyle)?.getRadius()).toBe(8);
        });
        it("has correct fill color", () => {
          expect(
            (pointStyle.getImage() as CircleStyle)?.getFill()?.getColor(),
          ).toBe("pink");
        });
        it("has correct stroke color and width", () => {
          expect(
            (pointStyle.getImage() as CircleStyle)?.getStroke()?.getColor(),
          ).toBe("white");
          expect(
            (pointStyle.getImage() as CircleStyle)?.getStroke()?.getWidth(),
          ).toBe(3);
        });
      });
      describe("polygon style", () => {
        it("has correct fill color", () => {
          expect(polygonStyle.getFill()?.getColor()).toBe(
            chroma("pink").alpha(0.25).css(),
          );
        });
        it("has correct stroke color and width", () => {
          expect(polygonStyle.getStroke()?.getColor()).toBe("white");
          expect(polygonStyle.getStroke()?.getWidth()).toBe(2);
        });
      });
      describe("line style", () => {
        it("has correct color (back stroke)", () => {
          expect(lineStyle[0].getStroke()?.getColor()).toBe("white");
        });
        it("has correct width (back stroke)", () => {
          expect(lineStyle[0].getStroke()?.getWidth()).toBe(8);
        });
        it("has correct color (front stroke)", () => {
          expect(lineStyle[1].getStroke()?.getColor()).toBe("pink");
        });
        it("has correct width (front stroke)", () => {
          expect(lineStyle[1].getStroke()?.getWidth()).toBe(3);
        });
      });
    });
  });

  describe("#createStyleFunction", () => {
    let styleFn: StyleFunction;
    let feature: Feature;
    it("returns a function", () => {
      styleFn = createStyleFunction(
        createGeometryStyles({
          color: "blue",
        }),
      );
      feature = new Feature();
    });
    describe("with linestring geometry", () => {
      beforeEach(() => {
        feature.setGeometry(new LineString([]));
      });
      it("resolves to a double style with stroke", () => {
        const style = styleFn(feature, 1) as Style[];
        expect(style).toEqual([expect.any(Style), expect.any(Style)]);
        expect(style[0].getStroke()).toBeTruthy();
        expect(style[0].getFill()).toBeFalsy();
        expect(style[0].getImage()).toBeFalsy();
      });
    });
    describe("with point geometry", () => {
      beforeEach(() => {
        feature.setGeometry(new Point([]));
      });
      it("resolves to a style with image", () => {
        const style = styleFn(feature, 1) as Style;
        expect(style.getImage()).toBeTruthy();
        expect(style.getFill()).toBeFalsy();
        expect(style.getStroke()).toBeFalsy();
      });
    });
    describe("with polygon geometry", () => {
      beforeEach(() => {
        feature.setGeometry(new Polygon([]));
      });
      it("resolves to a style with fill and stroke", () => {
        const style = styleFn(feature, 1) as Style;
        expect(style.getFill()).toBeTruthy();
        expect(style.getStroke()).toBeTruthy();
        expect(style.getImage()).toBeFalsy();
      });
    });
  });

  describe("built-in styles", () => {
    let pointFeature: Feature;
    let pointStyle: Style;
    beforeEach(() => {
      pointFeature = new Feature(new Point([]));
    });
    describe("default style", () => {
      beforeEach(() => {
        const styleFn = defaultStyle;
        pointStyle = styleFn(pointFeature, 1) as Style;
      });
      it("uses the primary theme color", () => {
        expect(
          (pointStyle.getImage() as CircleStyle)?.getFill()?.getColor(),
        ).toEqual("blue");
      });
    });
    describe("default highlight style", () => {
      beforeEach(() => {
        const styleFn = defaultHighlightStyle;
        pointStyle = styleFn(pointFeature, 1) as Style;
      });
      it("uses the secondary theme color", () => {
        expect(
          (pointStyle.getImage() as CircleStyle)?.getFill()?.getColor(),
        ).toEqual("red");
      });
    });
  });
});
