import urllib.request, urllib.parse, re, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Submit the form and capture the response page HTML
url = 'https://n8n.srv1398596.hstgr.cloud/form/rappi-print'

# Use a sample pedido text
data = urllib.parse.urlencode({
    'field-0': '1x prueba test'
}).encode()

req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Content-Type', 'application/x-www-form-urlencoded')

try:
    resp = urllib.request.urlopen(req)
    html = resp.read().decode('utf-8', errors='replace')
    print(f"Status: {resp.status}")
    print(f"URL: {resp.url}")
    print(f"Length: {len(html)}")

    # Buscar printing-screen
    idx = html.find('printing-screen')
    if idx > 0:
        print(f"printing-screen at {idx}")
        print(html[max(0,idx-100):idx+500])
    else:
        print("NOT FOUND printing-screen in response")
        # Mostrar primeros 2000 chars
        print("First 2000 chars:")
        print(html[:2000])
except Exception as e:
    print(f"Error: {e}")
