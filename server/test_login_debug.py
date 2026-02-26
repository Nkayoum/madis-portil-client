import requests

url = 'http://localhost:8000/api/v1/auth/login/'
data = {'email': 'admin@madis.com', 'password': 'wrongpassword'}
response = requests.post(url, json=data)

print(f"Status Code: {response.status_code}")
print(f"Response Content: {response.content}")
print(f"JSON: {response.json()}")
