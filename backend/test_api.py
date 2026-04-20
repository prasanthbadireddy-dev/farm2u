import requests
try:
    r = requests.get('http://localhost:8000/api/vegetables')
    data = r.json()
    if data['success']:
        print("Total results:", len(data['results']))
        csv_count = sum(1 for item in data['results'] if item.get('type') == 'CSV Farmer')
        print("CSV Farmers:", csv_count)
except Exception as e:
    print("Error:", e)
