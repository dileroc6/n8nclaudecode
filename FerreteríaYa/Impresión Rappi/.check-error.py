import io, sys, urllib.request, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

api_key = os.getenv('N8N_API_KEY')

for exec_id in ['26514', '26512']:
    req = urllib.request.Request(f'https://n8n.srv1398596.hstgr.cloud/api/v1/executions/{exec_id}?includeData=true', headers={'X-N8N-API-KEY': api_key})
    data = urllib.request.urlopen(req).read().decode()
    print(f"=== Exec {exec_id} ===")
    # Buscar nodos que fallaron y mensajes
    msgs = re.findall(r'"(message|description|nodeName)":"((?:\\.|[^"\\])*)"', data)
    seen = set()
    for k, v in msgs:
        key = (k, v[:80])
        if key in seen: continue
        seen.add(key)
        print(f"  {k}: {v[:200]}")
    print()
