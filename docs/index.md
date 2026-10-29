---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Geospatial SDK"
  text: "A Javascript toolkit for geospatial applications"
  tagline: "Learn more about how to use it and how it works."
  actions:
    - theme: brand
      text: Guides
      link: /guides/introduction
    - theme: alt
      text: API Reference
      link: /api
    - theme: alt
      text: Playground & Examples
      link: https://camptocamp.github.io/geospatial-sdk/playground/

features:
  - title: "OpenLayers support"
    icon: { light: 'https://openlayers.org/theme/img/logo-light.svg', dark: 'https://openlayers.org/theme/img/logo-dark.svg', alt: 'OpenLayers logo', width: '32px', height: '32px' }
    details: "The SDK can help you create a map with OpenLayers, when you need 2D projections and flexibility."
    linkText: 'Click here to discover how'
    link: /api/📦-openlayers/
  - title: "MapLibre support"
    icon: { src: 'https://maplibre.org/maplibre-style-spec/assets/logo.svg', alt: 'MapLibre logo', width: '32px', height: '32px' }
    details: "The SDK can help you create a map with MapLibre, when you need slick 3D rendering and performance."
    linkText: 'Click here to discover how'
    link: /api/📦-maplibre/
  - title: "WebComponents support"
    icon: { src: 'https://www.svgrepo.com/show/354542/webcomponents.svg', alt: 'WebComponents logo', width: '32px', height: '32px' }
    details: "The SDK also lets you encapsulate a map in a WebComponent for easy integration."
    linkText: 'Click here to discover how'
    link: /api/📦-elements/
  - title: "What is a Map Context?"
    details: "Map Contexts are an essential part of the SDK. They offer a declarative and serializable way to create maps and modify them."
    linkText: 'Click here to learn more'
    link: /guides/map-context
  - title: "How does the Map Context Diff system work?"
    details: 'Context Diffs are how the SDK modifies an existing map: adding layers, changing the view, etc.'
    linkText: 'Click here to learn more'
    link: /guides/map-context-diff  
  - title: "How do I zoom on a layer?"
    details: "The SDK offers a utility for extracting an extent out of a map layer."
    linkText: 'Click here to learn how'
    link: /guides/layer-extent
---
