import requests
import sys

def loop():
    for word in sys.stdin:
        word = word.strip()
        if not word:
            continue
        
        try:
            res = requests.get(url=f"http://localhost:8080/api/{word}")

            if res.status_code == 404:
                print(f"[404] Not found: {word}")
            else:
                data = res.json()
                print(f"[{res.status_code}] Found: {word}")
                print(data)

        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")

loop()
