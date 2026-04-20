import requests
try:
    r = requests.get('http://localhost:8000/api/vegetables')
    data = r.json()
    with open("api_check.txt", "w", encoding="utf-8") as f:
        if data.get('success'):
            f.write(f"Total results: {len(data['results'])}\n")
            csv_count = sum(1 for item in data['results'] if item.get('type') == 'CSV Farmer')
            f.write(f"CSV Farmers: {csv_count}\n")
        else:
            f.write("Success False\n")
except Exception as e:
    with open("api_check.txt", "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
