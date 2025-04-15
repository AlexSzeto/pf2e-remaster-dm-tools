import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { openFloatingPrompt } from "../common/floating-menu.js";

export const EditableText = ({value, staticClasses, onChange}) => html`
  <div
    class=${staticClasses ?? ''}"
    onClick=${(e) => openFloatingPrompt(e, value, onChange)}
    style="display: inline-block;"
  >${value && value.length > 0 ? value : '(None)'}</div>
`