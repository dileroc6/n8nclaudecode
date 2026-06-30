#!/usr/bin/env python3
import json, urllib.request, urllib.error, uuid, os

N8N_URL = os.getenv("N8N_API_URL")
N8N_KEY = os.getenv("N8N_API_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
SSH_KEY = os.getenv("SSH_PRIVATE_KEY")

SYSTEM_PROMPT = (
    "Eres el asistente administrador del sitio WordPress ferreteriaya.com.co (ferreteria en Colombia). "
    "Cuando el usuario te de una instruccion en espanol, responde UNICAMENTE con el comando WP-CLI exacto "
    "para ejecutarla. No uses markdown, no uses explicacion, no uses bloques de codigo. Solo el comando WP-CLI. "
    "Siempre agrega al final del comando: --path=/home/u228175010/domains/ferreteriaya.com.co/public_html "
    "Ejemplos de respuestas correctas: "
    "wp option update blogname 'Nueva Ferreteria' --path=/home/u228175010/domains/ferreteriaya.com.co/public_html | "
    "wp wc product update 123 --regular_price='50000' --user=1 --path=/home/u228175010/domains/ferreteriaya.com.co/public_html | "
    "wp wc product update 456 --stock_quantity=20 --user=1 --path=/home/u228175010/domains/ferreteriaya.com.co/public_html | "
    "wp post update 45 --post_title='Nuevo Titulo' --path=/home/u228175010/domains/ferreteriaya.com.co/public_html "
    "Si necesitas datos que el usuario no dio (como el ID del producto), responde SOLO con: PREGUNTA: [tu pregunta]. "
    "Si el mensaje no es una instruccion de administracion del sitio web, responde SOLO con: NO_ADMIN"
)

def api(method, path, data=None):
    url = f"{N8N_URL}/api/v1{path}"
    body = json.dumps(data, ensure_ascii=False).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("X-N8N-API-KEY", N8N_KEY)
    if body:
        req.add_header("Content-Type", "application/json; charset=utf-8")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode('utf-8')}
    except Exception as e:
        return {"error": str(e)}

def nid():
    return str(uuid.uuid4())

# --- CREDENTIALS ---
print("Creando credencial Telegram...")
tg_cred = api("POST", "/credentials", {
    "name": "Telegram Bot FerreteriaYa",
    "type": "telegramApi",
    "data": {"accessToken": TELEGRAM_TOKEN}
})
tg_id = tg_cred.get("id", "")
print(f"  Telegram id={tg_id}" if tg_id else f"  ERROR: {tg_cred.get('body','')[:300]}")

print("Creando credencial SSH...")
ssh_cred = api("POST", "/credentials", {
    "name": "SSH FerreteriaYa WordPress",
    "type": "sshUserPrivateKey",
    "data": {
        "host": "141.136.43.59",
        "port": 65002,
        "username": "u228175010",
        "privateKey": SSH_KEY
    }
})
ssh_id = ssh_cred.get("id", "")
print(f"  SSH id={ssh_id}" if ssh_id else f"  ERROR: {ssh_cred.get('body','')[:300]}")

if not tg_id or not ssh_id:
    print("\nNo se pudieron crear las credenciales. Abortando.")
    exit(1)

# --- WORKFLOW NODES ---
prepare_code = (
    "const msg = $input.item.json.message.text || '';\n"
    "const chatId = $input.item.json.message.chat.id;\n"
    "return {\n"
    "  chatId,\n"
    "  claudeBody: JSON.stringify({\n"
    "    model: 'claude-sonnet-4-6',\n"
    "    max_tokens: 512,\n"
    f"    system: {json.dumps(SYSTEM_PROMPT)},\n"
    "    messages: [{ role: 'user', content: msg }]\n"
    "  })\n"
    "};"
)

extract_code = (
    "const resp = $input.item.json;\n"
    "const text = (resp.content && resp.content[0] ? resp.content[0].text : '').trim();\n"
    "const chatId = $('Preparar Solicitud Claude').item.json.chatId;\n"
    "const isCommand = !text.startsWith('PREGUNTA:') && text !== 'NO_ADMIN' && text.length > 0;\n"
    "return { text, chatId, isCommand: isCommand ? 'yes' : 'no' };"
)

nodes = [
    {
        "id": nid(), "name": "Telegram Trigger",
        "type": "n8n-nodes-base.telegramTrigger",
        "typeVersion": 1.1, "position": [0, 0],
        "webhookId": str(uuid.uuid4()),
        "parameters": {"updates": ["message"], "additionalFields": {}},
        "credentials": {"telegramApi": {"id": tg_id, "name": "Telegram Bot FerreteriaYa"}}
    },
    {
        "id": nid(), "name": "Preparar Solicitud Claude",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2, "position": [260, 0],
        "parameters": {"jsCode": prepare_code}
    },
    {
        "id": nid(), "name": "Claude - Interpretar Comando",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2, "position": [520, 0],
        "parameters": {
            "method": "POST",
            "url": "https://api.anthropic.com/v1/messages",
            "sendHeaders": True,
            "headerParameters": {"parameters": [
                {"name": "x-api-key", "value": ANTHROPIC_KEY},
                {"name": "anthropic-version", "value": "2023-06-01"}
            ]},
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": "={{ $json.claudeBody }}",
            "options": {}
        }
    },
    {
        "id": nid(), "name": "Extraer Respuesta",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2, "position": [780, 0],
        "parameters": {"jsCode": extract_code}
    },
    {
        "id": nid(), "name": "Es Comando WP?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2, "position": [1040, 0],
        "parameters": {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [{
                    "id": nid(),
                    "leftValue": "={{ $json.isCommand }}",
                    "rightValue": "yes",
                    "operator": {"type": "string", "operation": "equals"}
                }],
                "combinator": "and"
            }
        }
    },
    {
        "id": nid(), "name": "Ejecutar WP-CLI",
        "type": "n8n-nodes-base.ssh",
        "typeVersion": 1, "position": [1300, -140],
        "parameters": {"command": "={{ $json.text }}"},
        "credentials": {"sshUserPrivateKey": {"id": ssh_id, "name": "SSH FerreteriaYa WordPress"}}
    },
    {
        "id": nid(), "name": "Responder Exito",
        "type": "n8n-nodes-base.telegram",
        "typeVersion": 1.2, "position": [1560, -140],
        "parameters": {
            "chatId": "={{ $('Extraer Respuesta').item.json.chatId }}",
            "text": "=Listo:\n\nComando ejecutado:\n{{ $('Extraer Respuesta').item.json.text }}\n\nResultado:\n{{ $json.stdout }}",
            "additionalFields": {}
        },
        "credentials": {"telegramApi": {"id": tg_id, "name": "Telegram Bot FerreteriaYa"}}
    },
    {
        "id": nid(), "name": "Responder Info",
        "type": "n8n-nodes-base.telegram",
        "typeVersion": 1.2, "position": [1300, 140],
        "parameters": {
            "chatId": "={{ $json.chatId }}",
            "text": "={{ $json.text }}",
            "additionalFields": {}
        },
        "credentials": {"telegramApi": {"id": tg_id, "name": "Telegram Bot FerreteriaYa"}}
    }
]

connections = {
    "Telegram Trigger": {"main": [[{"node": "Preparar Solicitud Claude", "type": "main", "index": 0}]]},
    "Preparar Solicitud Claude": {"main": [[{"node": "Claude - Interpretar Comando", "type": "main", "index": 0}]]},
    "Claude - Interpretar Comando": {"main": [[{"node": "Extraer Respuesta", "type": "main", "index": 0}]]},
    "Extraer Respuesta": {"main": [[{"node": "Es Comando WP?", "type": "main", "index": 0}]]},
    "Es Comando WP?": {"main": [
        [{"node": "Ejecutar WP-CLI", "type": "main", "index": 0}],
        [{"node": "Responder Info", "type": "main", "index": 0}]
    ]},
    "Ejecutar WP-CLI": {"main": [[{"node": "Responder Exito", "type": "main", "index": 0}]]}
}

workflow_data = {
    "name": "FerreteriaYa - Bot Admin Telegram",
    "active": False,
    "nodes": nodes,
    "connections": connections,
    "settings": {"executionOrder": "v1"}
}

print("\nCreando workflow en n8n...")
result = api("POST", "/workflows", workflow_data)
wf_id = result.get("id", "")
if wf_id:
    print(f"\nEXITO! Workflow creado: {N8N_URL}/workflow/{wf_id}")
    print(f"ID del workflow: {wf_id}")
else:
    print(f"\nERROR al crear workflow:")
    print(result.get("body", str(result))[:1000])
