import json

with open('data.json', 'r', encoding='utf-8') as f:
  data = json.load(f)

tiles = {tile['path']: tile for tile in data.get('tiles', [])}
tiles_count = {item['path']: item['count'] for item in data.get('tilesCount', [])}

combined = []
for tile_id, tile in tiles.items():
  combined_tile = tile.copy()
  combined_tile['count'] = tiles_count.get(tile_id, 0)
  combined.append(combined_tile)

if 'tilesCount' in data:
  del data['tilesCount']
data['tiles'] = combined
with open('output.json', 'w', encoding='utf-8') as f:
  json.dump(data, f, ensure_ascii=False, indent=2)
