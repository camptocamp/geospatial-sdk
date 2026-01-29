import { FlatStyleLike } from "ol/style/flat.js";
import chroma from "chroma-js";

const color = "rgb(0, 0, 255)";
const fillColor = chroma(color).alpha(0.25).css();
export const defaultStyle: FlatStyleLike = [
  {
    filter: ["==", ["geometry-type"], "LineString"],
    style: [
      {
        "stroke-color": "white",
        "stroke-width": 6,
      },
      {
        "stroke-color": color,
        "stroke-width": 2,
      },
    ],
  },
  {
    filter: ["==", ["geometry-type"], "Polygon"],
    style: {
      "stroke-color": "white",
      "stroke-width": 2,
      "fill-color": fillColor,
    },
  },
  {
    filter: ["==", ["geometry-type"], "Point"],
    style: {
      "circle-fill-color": color,
      "circle-radius": 7,
      "circle-stroke-color": "white",
      "circle-stroke-width": 2,
    },
  },
];

const hlColor = "rgb(0, 0, 255)";
const hlFillColor = chroma(hlColor).alpha(0.25).css();
export const defaultHighlightStyle: FlatStyleLike = [
  {
    filter: ["==", ["geometry-type"], "LineString"],
    style: [
      {
        "stroke-color": "white",
        "stroke-width": 8,
      },
      {
        "stroke-color": hlColor,
        "stroke-width": 3,
      },
    ],
  },
  {
    filter: ["==", ["geometry-type"], "Polygon"],
    style: {
      "stroke-color": "white",
      "stroke-width": 3,
      "fill-color": hlFillColor,
    },
  },
  {
    filter: ["==", ["geometry-type"], "Point"],
    style: {
      "circle-fill-color": hlColor,
      "circle-radius": 8,
      "circle-stroke-color": "white",
      "circle-stroke-width": 3,
    },
  },
];
