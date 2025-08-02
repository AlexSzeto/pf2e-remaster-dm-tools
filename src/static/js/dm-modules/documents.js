import { html } from 'htm/preact'

import { ContentSection } from '../components/content-section.js'
import { MarkdownDocument } from '../components/md-doc.js'
import { PinnedItemsList } from '../components/pinned-items-list.js'

export function Documents(props) {
    const { 
        docs, 
        pinnedDocs, 
        onLoadDocument, 
        onSaveDocument, 
        onCloseDocument, 
        onCloseAllDocuments, 
        onUnpin, 
        onShowModal, 
        onShowImageViewer,
        onContextAction
    } = props

    return html`
        <${ContentSection}
          label="Documents"
          actions=${[
            {
              icon: 'plus',
              onClick: () => onShowModal('docs'),
            },
            {
              icon: 'x',
              onClick: () => onCloseAllDocuments(),
            },
          ]}
        >
          <${PinnedItemsList} 
            items=${pinnedDocs.filter(item => !docs.some(doc => doc.loaded && doc.path === item.id))}
            onClick=${item => onLoadDocument(item.label, item.id)}
            onUnpin=${id => onUnpin('docs', id)}
          />
          <div class="doc-grid">
            ${docs.map(
              (doc) => html`
                <div class="doc-container ${doc.loaded ? '' : 'hidden'}">
                  <${MarkdownDocument}
                    loaded=${doc.loaded}
                    label=${doc.label}
                    path=${doc.path}
                    text=${doc.text}
                    onContextAction=${onContextAction}
                    onPreviewImage=${(url) => onShowImageViewer(url)}
                    onEdit=${(path, text) => onSaveDocument(path, text)}
                    onClose=${(path) => onCloseDocument(path)}
                  />
                </div>
              `
            )}
          </div>
        </${ContentSection}>
    `
}
