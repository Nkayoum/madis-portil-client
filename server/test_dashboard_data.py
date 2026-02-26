import urllib.request
import json

token = "ac18942358268c79d17a6165fa1420473fd0651b"
url = "http://localhost:8000/api/v1/construction/sites/"
headers = {"Authorization": f"Token {token}"}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(f"Total sites: {data['count']}")
        for site in data['results']:
            print(f" - {site['name']} (Status: {site['status']})")
except Exception as e:
    print(f"Error: {e}")
