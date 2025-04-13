import { Component } from "preact";
import { html } from "htm/preact";

export class Icon extends Component {

  render() {
    return html`<div
      style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;"
      dangerouslySetInnerHTML=${{ __html: feather.icons[this.props.icon].toSvg({ width: '100%', height: '100%' }) }}></div>
    `
  }
}