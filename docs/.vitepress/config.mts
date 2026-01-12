import {defineConfig} from 'vitepress'
import typedocSidebar from '../api/typedoc-sidebar.json'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Geospatial SDK",
  description: "Documentation website",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guides', link: '/guides/layer-extent' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Examples', link: 'https://camptocamp.github.io/geospatial-sdk/',  }
    ],

    sidebar: [
      {
        text: 'Guides',
        items: [
          { text: 'Layer Extent Retrieval', link: '/guides/layer-extent' }
        ]
      },
      {
        text: 'API Reference',
        items: typedocSidebar,
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
