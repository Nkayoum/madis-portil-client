import os
import requests
import json
import logging
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = 'http://localhost:8000/api/v1'

def test_file_upload_security():
    logger.info("=== Testing Secure File Upload ===")
    url = f"{BASE_URL}/documents/"
    
    # Authenticate as a normal user to test the upload endpoint
    login_url = f"{BASE_URL}/auth/login/"
    login_res = requests.post(login_url, json={"email": "ivanmpondo9@gmail.com", "password": "password123"})
    
    if login_res.status_code != 200:
        logger.error(f"Failed to login to test file upload: {login_res.status_code}")
        return

    token = login_res.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a fake malicious file pretending to be PNG
    malicious_content = b"#!/bin/bash\necho 'Hacked'"
    with open('malicious.png', 'wb') as f:
        f.write(malicious_content)
        
    try:
        with open('malicious.png', 'rb') as f:
            files = {'file': ('malicious.png', f, 'image/png')}
            data = {'title': 'Hack attempt', 'category': 'AUTRE', 'property': 1}
            
            res = requests.post(url, headers=headers, data=data, files=files)
            
            logger.info(f"Upload Response Code: {res.status_code}")
            logger.info(f"Upload Response Body: {res.text}")
            
            if res.status_code == 400 and 'Type de fichier suspect' in res.text:
                logger.info("✅ File validation correctly rejected the fake image.")
            else:
                logger.error("❌ File validation failed or returned unexpected error.")
    finally:
        os.remove('malicious.png')

def test_throttling():
    logger.info("=== Testing API Rate Limiting (Throttling) ===")
    url = f"{BASE_URL}/auth/login/"
    payload = {"email": "test@test.com", "password": "wrongpassword"}
    
    # We send 110 requests. AnonRateThrottle is set to 100/day.
    success_count = 0
    throttled_count = 0
    
    def make_request():
        return requests.post(url, json=payload)
        
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(lambda _: make_request(), range(110))
        
    for res in results:
        if res.status_code == 429:
            throttled_count += 1
        elif res.status_code in (200, 400, 401):
            success_count += 1
            
    logger.info(f"Requests passed (expected <= 100): {success_count}")
    logger.info(f"Requests throttled (429 Too Many Requests): {throttled_count}")
    
    if throttled_count > 0:
        logger.info("✅ Throttling is ACTIVE and working.")
    else:
        logger.error("❌ Throttling failed to block requests.")


if __name__ == "__main__":
    test_file_upload_security()
    test_throttling()
