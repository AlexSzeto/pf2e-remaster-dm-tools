import { Component } from "preact";
import { html } from "htm/preact";

export class Icon extends Component {

  render() {
    return html`<box-icon 
    name=${this.props.icon}
    type=${this.props.type ?? "regular"} 
    color="${this.props.color ?? "inherit"}"
    size=${this.props.size ?? "md"}
    />`
  }
}