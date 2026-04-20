import json, uuid, os

crops_file = os.path.join(os.path.dirname(__file__), 'backend', 'crops.json')
with open(crops_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

changed = 0
for crop in data:
    if not crop.get('id'):
        crop['id'] = str(uuid.uuid4())
        changed += 1

with open(crops_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Fixed {changed} crops. Total: {len(data)}")
