export const getHTML = (id) => {
  const titleOf = {
    'index': 'Home',
    'card-printer': 'Card Printer',
    'creature-creator': 'Creature Creator',
    'dm-screen': 'DM Screen',
    'pc-screen': 'PC Screen',
    'insert-media': 'Insert Media',
    'map-editor': 'Map Editor',
    'name-generator': 'Name Generator',
  }
  const title = titleOf[id] ?? null
  if (!title) {
    return null
  }
  const HTMLPage = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link
        rel="stylesheet"
        href="src/css/pf2e.css"
      />
      <link
        rel="stylesheet"
        href="src/css/components.css"
      />
      <link
        rel="stylesheet"
        href="src/css/layout.css"
      />
      <link
        rel="stylesheet"
        href="src/css/${id}.css"
      />
      <script
        src="https://unpkg.com/boxicons@2.1.4/dist/boxicons.js"
      ></script>
      <script
        src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"
      ></script>
      <script
        src="https://cdn.jsdelivr.net/npm/ace-builds@1.39.1/src-min/ace.js"
      ></script>
      <script type="importmap">
        {
          "imports": {
            "preact": "https://esm.sh/preact@10.19.2",
            "preact/": "https://esm.sh/preact@10.19.2/",
            "htm/preact": "https://esm.sh/htm@3.1.1/preact?external=preact"
          }
        }
      </script>
      <script
        type="module"
        src="src/js/layout.js"
      ></script>
      <script
        type="module"
        src="src/js/${id}.js"
      ></script>
    </head>
    <body>
      <div class="header"></div>
      <div class="page-content"></div>
    </body>
  </html>
  `
  return HTMLPage
}
