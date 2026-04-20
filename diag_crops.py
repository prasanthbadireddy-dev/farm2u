import json
data = json.load(open('backend/crops.json'))
no_id = [c for c in data if 'id' not in c]
no_price = [c for c in data if 'price' not in c]
print(f"Total crops: {len(data)}")
print(f"Crops WITHOUT id: {len(no_id)}")
print(f"Crops WITHOUT price: {len(no_price)}")
print(f"Sample crop: {data[-1]}")
