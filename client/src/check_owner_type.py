import requests
import json

try:
    response = requests.get('http://localhost:8000/api/v1/properties/')
    response.raise_for_status()
    data = response.json()
    if isinstance(data, list) and len(data) > 0:
        prop = data[0]
        print(f"Owner field type: {type(prop.get('owner'))}")
        print(f"Owner field value: {prop.get('owner')}")
        print(f"Owner name: {prop.get('owner_name')}")
    elif isinstance(data, dict) and 'results' in data:
         if len(data['results']) > 0:
            prop = data['results'][0]
            print(f"Owner field type: {type(prop.get('owner'))}")
            print(f"Owner field value: {prop.get('owner')}")
    else:
        print("No properties found or unexpected format")
except Exception as e:
    print(f"Error: {e}")
