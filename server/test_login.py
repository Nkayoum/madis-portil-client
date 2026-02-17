import urllib.request
import json

url = 'http://localhost:8000/api/v1/auth/login/'
data = {'email': 'admin@madis.com', 'password': 'adminpass'}
headers = {'Content-Type': 'application/json'}

print(f"Testing login to {url} with {data}")

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
