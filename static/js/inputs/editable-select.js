import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { openFloatingSelect } from "../common/floating-menu.js";

export const EditableSelect = ({options, value, staticClasses, onChange}) => html`
    <div
      class="${staticClasses ?? ''}"
      onClick=${(e) => openFloatingSelect(e, options.map(option => ({ label: option, action: () => onChange(option) })))}
      style="display: inline-block;"
    >${value && value.length > 0 ? value : '(None)'}</div>
  `
