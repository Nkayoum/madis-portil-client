import requests
import json

base_url = "http://localhost:8000/api/v1"
creds = {"email": "tech@tech.com", "password": "techpass"}

# Login
login_res = requests.post(f"{base_url}/auth/login/", json=creds)
if login_res.status_code != 200:
    print(f"Login failed: {login_res.text}")
    exit(1)

token = login_res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Check properties
props_res = requests.get(f"{base_url}/properties/", headers=headers)
print("Properties List:")
print(json.dumps(props_res.json(), indent=2))

# Check marketplace
market_res = requests.get(f"{base_url}/marketplace/", headers=headers)
print("\nMarketplace List:")
print(json.dumps(market_res.json(), indent=2))
