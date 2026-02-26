import urllib.request
import json

token = "1d9e7f4b83326bcf827b6be1aa8daa963db487fd"
url = "http://localhost:8000/api/v1/construction/sites/"
headers = {"Authorization": f"Token {token}"}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(f"Content: {response.read().decode('utf-8')[:1000]}")
except Exception as e:
    print(f"Error: {e}")
