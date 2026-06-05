import io, sys, urllib.request, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

api_key = os.getenv('N8N_API_KEY')
req = urllib.request.Request('https://n8n.srv1398596.hstgr.cloud/api/v1/workflows/KSUMI2TaXjYyjZOc', headers={'X-N8N-API-KEY': api_key})
data = urllib.request.urlopen(req).read().decode()

# Check if printing-screen content is there (with VOLVER button)
if 'VOLVER AL FORMULARIO' in data:
    print("OK: VOLVER AL FORMULARIO present in n8n workflow")
else:
    print("MISSING: VOLVER AL FORMULARIO not in n8n workflow")

# Check what's in printing-screen div
m = re.search(r'class=\\\"printing-screen\\\"[^>]{0,300}', data)
if m:
    print("Found:", m.group(0)[:300])

# Check active status
if '"active":true' in data:
    print("Active: true")
else:
    print("Active status unclear")
