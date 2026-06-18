import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { MapContext } from "@geospatial-sdk/core";
import OlMap from "ol/Map.js";
import { syncMapWithContext, MapSyncHandle } from "@geospatial-sdk/openlayers";

@customElement("geosdk-map")
export class SdkMapElement extends LitElement {
  static styles = css``;

  @property({
    attribute: false,
  })
  accessor context: MapContext = {
    view: {
      center: [0, 0],
      zoom: 2,
    },
    layers: [],
  };

  @query("div")
  accessor mapElement!: HTMLDivElement;

  private sync: MapSyncHandle | null = null;
  private onContextChange: (() => void) | null = null;

  public async firstUpdated() {
    await this.startSync();
  }

  // Re-attaching the element to the DOM rebuilds the map; disconnect tears it
  // down. firstUpdated handles the very first connect (mapElement isn't
  // rendered yet at the initial connectedCallback).
  public connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated && !this.sync) void this.startSync();
  }

  private async startSync() {
    this.sync = await syncMapWithContext(
      this.mapElement,
      () => this.context,
      (onChange) => {
        this.onContextChange = onChange;
        return () => (this.onContextChange = null);
      },
    );
  }

  public updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("context")) {
      this.onContextChange?.();
    }
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this.sync?.stop();
    this.sync = null;
  }

  render() {
    return html`<div style="width: 100%; height: 100%"></div>`;
  }

  // do not create a shadow dom
  protected createRenderRoot() {
    return this;
  }

  public get olMap(): OlMap | null {
    return this.sync?.map ?? null;
  }
}
