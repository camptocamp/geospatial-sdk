import { createApp } from "vue";
import ui from "@nuxt/ui/vue-plugin";
import "./style.css";
import App from "./App.vue";

createApp(App).use(ui).mount("#app");
