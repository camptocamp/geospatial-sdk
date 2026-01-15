import { defineConfig } from "vitepress";
import typedocSidebar from "../api/typedoc-sidebar.json";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Geospatial SDK",
  description: "Documentation website",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guides", link: "/guides/introduction" },
      { text: "API Reference", link: "/api/" },
      {
        text: "Examples",
        link: "https://camptocamp.github.io/geospatial-sdk/",
      },
    ],

    sidebar: [
      {
        text: "Guides",
        items: [
          { text: "Introduction", link: "/guides/introduction" },
          { text: "Map Context", link: "/guides/map-context" },
          { text: "Map Context Diff", link: "/guides/map-context-diff" },
          { text: "Layer Extent", link: "/guides/layer-extent" },
        ],
      },
      {
        text: "API Reference",
        link: "/api/",
        items: typedocSidebar,
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/camptocamp/geospatial-sdk" },
    ],

    search: {
      provider: "local",
    },
  },
});
