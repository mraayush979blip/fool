import urllib.request
import json
import re

url = "https://html.duckduckgo.com/html/?q=ninja+slash+attack+transparent+gif"
req = urllib.request.Request(
    url, 
    data=None, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
)

try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    # Find image URLs
    img_urls = re.findall(r'src="([^"]+)"', html)
    for img in img_urls:
        if 'gif' in img.lower() or 'images' in img.lower():
            if img.startswith('//'):
                img = 'https:' + img
            elif img.startswith('/'):
                img = 'https://duckduckgo.com' + img
            
            print(f"Downloading {img}")
            urllib.request.urlretrieve(img, "public/ninja-attack.gif")
            print("Successfully downloaded a gif!")
            exit(0)
except Exception as e:
    print("Error:", e)
