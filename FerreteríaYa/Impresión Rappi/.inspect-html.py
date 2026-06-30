import io, sys, urllib.request, json, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

api_key = os.getenv('N8N_API_KEY')

req = urllib.request.Request('https://n8n.srv1398596.hstgr.cloud/api/v1/executions?workflowId=KSUMI2TaXjYyjZOc&limit=1&status=success', headers={'X-N8N-API-KEY': api_key})
data = urllib.request.urlopen(req).read().decode()
m = re.search(r'"id":"(\d+)"', data)
exec_id = m.group(1)
print(f"Exec: {exec_id}")

req2 = urllib.request.Request(f'https://n8n.srv1398596.hstgr.cloud/api/v1/executions/{exec_id}?includeData=true', headers={'X-N8N-API-KEY': api_key})
data2 = urllib.request.urlopen(req2).read().decode()

# Buscar parte de html que tenga printing-screen
idx = data2.find('printing-screen')
if idx > 0:
    start = max(0, idx - 200)
    end = min(len(data2), idx + 800)
    print("Found printing-screen at:", idx)
    print(data2[start:end])
else:
    print("printing-screen NOT FOUND in output")
    # Buscar generic HTML
    m2 = re.search(r'<!DOCTYPE[^"]{0,2000}', data2)
    if m2:
        print("HTML found (first 800 chars):")
        print(m2.group(0)[:800])
