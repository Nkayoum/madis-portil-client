import urllib.request
import json

# First login to get token
login_url = 'http://localhost:8000/api/v1/auth/login/'
login_data = {'email': 'admin@madis.com', 'password': 'adminpass'}
headers = {'Content-Type': 'application/json'}

print(f"Logging in as admin...")
req = urllib.request.Request(login_url, data=json.dumps(login_data).encode('utf-8'), headers=headers)
with urllib.request.urlopen(req) as response:
    login_resp = json.loads(response.read().decode('utf-8'))
    token = login_resp['token']
    print(f"Token obtained: {token[:10]}...")

# Now fetch projects
projects_url = 'http://localhost:8000/api/v1/projects/'
projects_headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Token {token}'
}

print(f"Fetching projects from {projects_url}...")
try:
    req = urllib.request.Request(projects_url, headers=projects_headers)
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
