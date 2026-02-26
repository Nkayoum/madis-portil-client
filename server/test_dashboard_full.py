import urllib.request
import json

token = "ac18942358268c79d17a6165fa1420473fd0651b"
headers = {"Authorization": f"Token {token}"}

endpoints = [
    "/construction/sites/",
    "/construction/milestones/?completed=false",
    "/construction/journal/"
]

for ep in endpoints:
    url = f"http://localhost:8000/api/v1{ep}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Endpoint: {ep} -> Status: {response.status}, Count: {data.get('count', 'N/A')}")
    except Exception as e:
        print(f"Endpoint: {ep} -> Error: {e}")
