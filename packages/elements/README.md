# `@geospatial-sdk/elements`

This package provides framework-agnostic [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) built with [Lit](https://lit.dev/) that allow you to display interactive maps using the Map Context model. 

## Installation

```sh
npm install @geospatial-sdk/elements
```

## Usage

```html
<script type="module">
  import '@geospatial-sdk/elements';
  
  const mapElement = document.querySelector('geosdk-map');
  mapElement.context = {
    layers: [
      { type: 'xyz', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' }
    ],
    view: { center: [6, 48.5], zoom: 5 }
  };
</script>

<geosdk-map style="width: 800px; height: 600px;"></geosdk-map>
```

## Documentation

For more detailed API documentation, see the [documentation website](https://camptocamp.github.io/geospatial-sdk/docs/).
