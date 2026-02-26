
import sys

try:
    with open('test_output.txt', 'rb') as f:
        content = f.read()
        # PowerShell redirection often uses UTF-16 LE
        try:
            text = content.decode('utf-16')
        except:
            text = content.decode('utf-8', errors='ignore')
        print(text)
except Exception as e:
    print(f"Error reading file: {e}")
