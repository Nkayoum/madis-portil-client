import requests

# Constants
BASE_URL = 'http://localhost:8000/api/v1'
LOGIN_URL = f'{BASE_URL}/auth/login/'
PROPERTIES_URL = f'{BASE_URL}/properties/'

# Admin credentials (assuming default admin)
EMAIL = 'admin@madis.com'
PASSWORD = 'password123'  # Replace with actual if known, or try to create a user if possible?
# If we can't login, we can't test. I'll assuming this is the test admin credential.

def reproduce():
    session = requests.Session()
    
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    try:
        resp = session.post(LOGIN_URL, json={'email': EMAIL, 'password': PASSWORD})
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        # Try creating a superuser via manage.py if needed? No, I can't interact.
        # Let's hope correct creds or I will just inspect code more.
        return

    token = resp.json().get('access')
    headers = {'Authorization': f'Bearer {token}'}
    print("Login successful.")

    # 2. Create Property Payload
    payload = {
        'name': 'Test Bureau 123',
        'address': '123 Rue de Test',
        'city': 'Conakry',
        'category': 'PROFESSIONNEL',
        'transaction_nature': 'VENTE',
        'management_type': 'MANDAT',
        'property_type': 'BUREAU',
        'status': 'DISPONIBLE',
        'surface': '100',
        # 'owner': '' # Intentionally empty
    }

    # 3. Send POST request
    print("Creating property...")
    resp = requests.post(PROPERTIES_URL, data=payload, headers=headers)
    
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == '__main__':
    reproduce()
