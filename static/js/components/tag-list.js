import { html } from "htm/preact"

export const getTagsList = dataList => dataList
  .reduce((list, data) => {
    if (data.tags) {
      data.tags.forEach(tag => {
        const data = list.find(t => t.tag === tag)
        if (!data) {
          list.push({ tag, count: 1 })
        } else {
          data.count++
        }
      })
    }
    return list
  }, [])
  .sort((a, b) => b.count - a.count)
  .map(t => t.tag)

export const toggleTag = (tag, selected) => {
  if(selected.includes(tag)) {
    return selected.filter(t => t !== tag)
  }
  return [...selected, tag]
}

export const getTaggedData = (dataList, selected) => {
  if (selected.length === 0) {
    return dataList
  }
  return dataList.filter(data => {
    if (!data.tags) {
      return false
    }
    return !(selected.some(tag => !data.tags.includes(tag)))
  })
}


export const TagList = ({ tags, selected, onSelect }) => html`
  <div class="tag-list">
    ${tags.map(tag => html`
      <div class="tag ${selected.includes(tag) ? 'selected' : ''}">
        <button onClick=${() => onSelect(tag)}>
          ${tag}
        </button>
      </div>
    `)}
  </div>
`
