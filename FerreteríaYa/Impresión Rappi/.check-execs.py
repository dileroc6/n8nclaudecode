import io, sys, urllib.request, re, json, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

api_key = os.getenv('N8N_API_KEY')

req = urllib.request.Request('https://n8n.srv1398596.hstgr.cloud/api/v1/executions?workflowId=KSUMI2TaXjYyjZOc&limit=10', headers={'X-N8N-API-KEY': api_key})
data = urllib.request.urlopen(req).read().decode()

# Listar ejecuciones recientes
execs = re.findall(r'\{"id":"(\d+)","finished":(\w+)[^}]*?"status":"(\w+)","startedAt":"([^"]+)"', data)
print(f"Total ejecuciones recientes: {len(execs)}")
for e in execs[:10]:
    print(f"  ID {e[0]}: status={e[2]}, started={e[3]}")
