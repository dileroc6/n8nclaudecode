import io, sys, urllib.request, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

api_key = os.getenv('N8N_API_KEY')

req = urllib.request.Request('https://n8n.srv1398596.hstgr.cloud/api/v1/executions?workflowId=KSUMI2TaXjYyjZOc&limit=1&status=success', headers={'X-N8N-API-KEY': api_key})
data = urllib.request.urlopen(req).read().decode()
m = re.search(r'"id":"(\d+)"', data)
exec_id = m.group(1)

req2 = urllib.request.Request(f'https://n8n.srv1398596.hstgr.cloud/api/v1/executions/{exec_id}?includeData=true', headers={'X-N8N-API-KEY': api_key})
data2 = urllib.request.urlopen(req2).read().decode()

# Buscar el div printing-screen renderizado (no la CSS)
idx = data2.find('<div class=\\"printing-screen\\"')
if idx < 0:
    idx = data2.find('printing-screen\\"><div')
if idx > 0:
    print(f"DIV at {idx}:")
    print(data2[idx:idx+600])
else:
    print("No <div printing-screen found")
    # Buscar body
    idx = data2.find('<body>')
    if idx > 0:
        print(f"<body> at {idx}:")
        print(data2[idx:idx+800])
