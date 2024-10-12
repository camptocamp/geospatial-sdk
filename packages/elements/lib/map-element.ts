import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { computeMapContextDiff, MapContext } from "@geospatial-sdk/core";
import OlMap from "ol/Map";
import {
  applyContextDiffToMap,
  createMapFromContext,
} from "@geospatial-sdk/openlayers";

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

  private map: OlMap | null = null;

  public async firstUpdated() {
    this.map = await createMapFromContext(this.context, this.mapElement);
  }

  public async updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("context")) {
      await this.contextHasChanged(
        changedProperties.get("context"),
        this.context,
      );
    }
  }

  async contextHasChanged(value: MapContext | undefined, oldValue: MapContext) {
    if (!this.map || !value) return;
    const diff = computeMapContextDiff(value, oldValue);
    await applyContextDiffToMap(this.map, diff);
  }

  render() {
    return html`<div style="width: 100%; height: 100%"></div>`;
  }

  // do not create a shadow dom
  protected createRenderRoot() {
    return this;
  }

  public get olMap() {
    return this.map;
  }
}
