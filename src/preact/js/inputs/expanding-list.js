import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { openFloatingPrompt } from "../common/floating-menu.js";
import { EditableText } from "./editable-text.js";
import { Icon } from "../components/icon.js";

export const ExpandingTextList = ({ values, onChange }) => html`
  <div class="expanding-list text">
    ${values.map((value, index) => EditableText({
      value,
      onChange: (newValue) => {
        const newValues = [...values]
        newValues[index] = newValue
        onChange(newValues)
      }
    }))}
    <button class="square small" onClick=${(e) => openFloatingPrompt(e, '', (newValue) => {
      const newValues = [...values, newValue]
      onChange(newValues)
    })}><${Icon} icon="plus" /></button>
  </div>
`