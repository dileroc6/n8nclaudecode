const https = require('https');
const crypto = require('crypto');

const N8N_URL = process.env.N8N_API_URL;
const N8N_KEY = process.env.N8N_API_KEY;
const TELEGRAM_CRED_ID = process.env.N8N_TG_CRED_ID;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const WC_KEY = process.env.WC_API_KEY;
const WC_SECRET = process.env.WC_API_SECRET;
const WP_BASE = process.env.WP_BASE_URL;

const SYSTEM_PROMPT = `Eres el asistente administrador del sitio WordPress ferreteriaya.com.co (ferreteria en Colombia). Cuando el usuario te de una instruccion en espanol, responde UNICAMENTE con un objeto JSON valido, sin markdown, sin texto adicional.

Acciones disponibles:

Cambiar precio de producto:
{"action":"update_price","product_name":"nombre del producto","price":"numero sin simbolos ni puntos"}

Cambiar stock de producto:
{"action":"update_stock","product_name":"nombre del producto","quantity":numero}

Cambiar titulo del sitio web:
{"action":"update_site_title","title":"nuevo titulo"}

Necesitas mas informacion:
{"action":"PREGUNTA","message":"tu pregunta en espanol"}

No es instruccion de administracion:
{"action":"NO_ADMIN","message":"respuesta en espanol"}

IMPORTANTE: Solo JSON valido, nunca uses comillas simples dentro del JSON, nunca uses markdown.`;

function nid() { return crypto.randomUUID(); }

function apiCall(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const url = new URL(`/api/v1${path}`, N8N_URL);
    const opts = {
      hostname: url.hostname, port: 443, path: url.pathname,
      method, headers: {
        'X-N8N-API-KEY': N8N_KEY,
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {})
      }
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({ raw }); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Crear credencial WooCommerce Basic Auth
  console.log('Creando credencial WooCommerce...');
  const wcCred = await apiCall('POST', '/credentials', {
    name: 'WooCommerce FerreteriaYa',
    type: 'httpBasicAuth',
    data: { user: WC_KEY, password: WC_SECRET }
  });
  const wcId = wcCred.id || '';
  console.log(wcId ? `  OK id=${wcId}` : `  ERROR: ${JSON.stringify(wcCred).slice(0, 300)}`);
  if (!wcId) { process.exit(1); }

  // --- CÓDIGO DE LOS NODOS ---
  const prepareCode = `
const msg = $input.item.json.message.text || '';
const chatId = $input.item.json.message.chat.id;
return {
  chatId,
  claudeBody: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: ${JSON.stringify(SYSTEM_PROMPT)},
    messages: [{ role: 'user', content: msg }]
  })
};`;

  const parseCode = `
const resp = $input.item.json;
const chatId = $('Preparar Solicitud').item.json.chatId;
const raw = resp.content && resp.content[0] ? resp.content[0].text.trim() : '';
let parsed = { action: 'NO_ADMIN', message: raw };
try {
  const clean = raw.replace(/^\`\`\`(?:json)?\\n?/,'').replace(/\\n?\`\`\`$/,'').trim();
  parsed = JSON.parse(clean);
} catch(e) {}
return {
  chatId,
  action: parsed.action || 'NO_ADMIN',
  product_name: parsed.product_name || '',
  price: String(parsed.price || ''),
  quantity: Number(parsed.quantity || 0),
  site_title: parsed.title || '',
  message: parsed.message || raw
};`;

  const buildUpdateCode = `
const searchResult = $input.item.json;
const claudeData = $('Parsear Respuesta').item.json;
const chatId = claudeData.chatId;

// WC search devuelve array directamente
const products = Array.isArray(searchResult) ? searchResult : (searchResult.data || [searchResult]);
const product = products.find(p => p && p.id);

if (!product) {
  return { chatId, found: false, product_name: claudeData.product_name };
}

let updateBody = {};
if (claudeData.action === 'update_price') {
  updateBody = { regular_price: claudeData.price };
} else if (claudeData.action === 'update_stock') {
  updateBody = { stock_quantity: claudeData.quantity, manage_stock: true };
}

return {
  chatId,
  found: true,
  productId: product.id,
  productName: product.name,
  updateBody: JSON.stringify(updateBody),
  action: claudeData.action,
  price: claudeData.price,
  quantity: claudeData.quantity
};`;

  // --- NODOS ---
  const nodes = [
    {
      id: nid(), name: 'Telegram Trigger',
      type: 'n8n-nodes-base.telegramTrigger',
      typeVersion: 1.1, position: [0, 0],
      webhookId: nid(),
      parameters: { updates: ['message'], additionalFields: {} },
      credentials: { telegramApi: { id: TELEGRAM_CRED_ID, name: 'Telegram Bot FerreteriaYa' } }
    },
    {
      id: nid(), name: 'Preparar Solicitud',
      type: 'n8n-nodes-base.code',
      typeVersion: 2, position: [240, 0],
      parameters: { jsCode: prepareCode }
    },
    {
      id: nid(), name: 'Claude API',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2, position: [480, 0],
      parameters: {
        method: 'POST', url: 'https://api.anthropic.com/v1/messages',
        sendHeaders: true,
        headerParameters: { parameters: [
          { name: 'x-api-key', value: ANTHROPIC_KEY },
          { name: 'anthropic-version', value: '2023-06-01' }
        ]},
        sendBody: true, specifyBody: 'json',
        jsonBody: '={{ $json.claudeBody }}', options: {}
      }
    },
    {
      id: nid(), name: 'Parsear Respuesta',
      type: 'n8n-nodes-base.code',
      typeVersion: 2, position: [720, 0],
      parameters: { jsCode: parseCode }
    },
    {
      id: nid(), name: 'Es Accion Producto?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2, position: [960, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
          conditions: [{
            id: nid(),
            leftValue: '={{ $json.action }}',
            rightValue: 'update_',
            operator: { type: 'string', operation: 'startsWith' }
          }],
          combinator: 'and'
        }
      }
    },
    {
      id: nid(), name: 'Es Accion Sitio?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2, position: [1200, -160],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
          conditions: [{
            id: nid(),
            leftValue: '={{ $json.action }}',
            rightValue: 'update_site_title',
            operator: { type: 'string', operation: 'equals' }
          }],
          combinator: 'and'
        }
      }
    },
    {
      id: nid(), name: 'Actualizar Titulo Sitio',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2, position: [1440, -300],
      parameters: {
        method: 'POST',
        url: `${WP_BASE}/wp-json/wp/v2/settings`,
        sendHeaders: true,
        headerParameters: { parameters: [
          { name: 'Authorization', value: `Basic ${Buffer.from(`${process.env.WP_USER}:${process.env.WP_PASSWORD}`).toString('base64')}` }
        ]},
        sendBody: true, specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({title: $json.site_title}) }}',
        options: {}
      }
    },
    {
      id: nid(), name: 'Buscar Producto WC',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2, position: [1440, -60],
      parameters: {
        method: 'GET',
        url: `${WP_BASE}/wp-json/wc/v3/products`,
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBasicAuth',
        sendQuery: true,
        queryParameters: { parameters: [
          { name: 'search', value: '={{ $json.product_name }}' },
          { name: 'per_page', value: '5' }
        ]},
        options: {}
      },
      credentials: { httpBasicAuth: { id: wcId, name: 'WooCommerce FerreteriaYa' } }
    },
    {
      id: nid(), name: 'Preparar Update',
      type: 'n8n-nodes-base.code',
      typeVersion: 2, position: [1680, -60],
      parameters: { jsCode: buildUpdateCode }
    },
    {
      id: nid(), name: 'Producto Encontrado?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2, position: [1920, -60],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
          conditions: [{
            id: nid(),
            leftValue: '={{ $json.found }}',
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true }
          }],
          combinator: 'and'
        }
      }
    },
    {
      id: nid(), name: 'Actualizar Producto WC',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2, position: [2160, -160],
      parameters: {
        method: 'PUT',
        url: `${WP_BASE}/wp-json/wc/v3/products/{{ $json.productId }}`,
        authentication: 'genericCredentialType',
        genericAuthType: 'httpBasicAuth',
        sendBody: true, specifyBody: 'json',
        jsonBody: '={{ $json.updateBody }}',
        options: {}
      },
      credentials: { httpBasicAuth: { id: wcId, name: 'WooCommerce FerreteriaYa' } }
    },
    {
      id: nid(), name: 'Telegram - Exito Producto',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2, position: [2400, -160],
      parameters: {
        chatId: "={{ $('Preparar Update').item.json.chatId }}",
        text: "=Listo! Producto actualizado:\n\nProducto: {{ $('Preparar Update').item.json.productName }}\nAccion: {{ $('Preparar Update').item.json.action === 'update_price' ? 'Precio -> $' + $('Preparar Update').item.json.price : 'Stock -> ' + $('Preparar Update').item.json.quantity + ' unidades' }}",
        additionalFields: {}
      },
      credentials: { telegramApi: { id: TELEGRAM_CRED_ID, name: 'Telegram Bot FerreteriaYa' } }
    },
    {
      id: nid(), name: 'Telegram - Exito Titulo',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2, position: [1680, -300],
      parameters: {
        chatId: "={{ $('Parsear Respuesta').item.json.chatId }}",
        text: "=Listo! Titulo del sitio actualizado a: {{ $('Parsear Respuesta').item.json.site_title }}",
        additionalFields: {}
      },
      credentials: { telegramApi: { id: TELEGRAM_CRED_ID, name: 'Telegram Bot FerreteriaYa' } }
    },
    {
      id: nid(), name: 'Telegram - Producto No Encontrado',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2, position: [2160, 60],
      parameters: {
        chatId: "={{ $json.chatId }}",
        text: "=No encontre el producto \"{{ $json.product_name }}\" en la tienda. Verifica el nombre e intenta de nuevo.",
        additionalFields: {}
      },
      credentials: { telegramApi: { id: TELEGRAM_CRED_ID, name: 'Telegram Bot FerreteriaYa' } }
    },
    {
      id: nid(), name: 'Telegram - Info',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2, position: [1200, 160],
      parameters: {
        chatId: '={{ $json.chatId }}',
        text: '={{ $json.message }}',
        additionalFields: {}
      },
      credentials: { telegramApi: { id: TELEGRAM_CRED_ID, name: 'Telegram Bot FerreteriaYa' } }
    }
  ];

  const connections = {
    'Telegram Trigger':     { main: [[{ node: 'Preparar Solicitud',       type: 'main', index: 0 }]] },
    'Preparar Solicitud':   { main: [[{ node: 'Claude API',               type: 'main', index: 0 }]] },
    'Claude API':           { main: [[{ node: 'Parsear Respuesta',        type: 'main', index: 0 }]] },
    'Parsear Respuesta':    { main: [[{ node: 'Es Accion Producto?',      type: 'main', index: 0 }]] },
    'Es Accion Producto?':  { main: [
      [{ node: 'Es Accion Sitio?',    type: 'main', index: 0 }],  // true
      [{ node: 'Telegram - Info',     type: 'main', index: 0 }]   // false
    ]},
    'Es Accion Sitio?': { main: [
      [{ node: 'Actualizar Titulo Sitio',  type: 'main', index: 0 }],  // true
      [{ node: 'Buscar Producto WC',       type: 'main', index: 0 }]   // false
    ]},
    'Actualizar Titulo Sitio': { main: [[{ node: 'Telegram - Exito Titulo',       type: 'main', index: 0 }]] },
    'Buscar Producto WC':      { main: [[{ node: 'Preparar Update',               type: 'main', index: 0 }]] },
    'Preparar Update':         { main: [[{ node: 'Producto Encontrado?',          type: 'main', index: 0 }]] },
    'Producto Encontrado?': { main: [
      [{ node: 'Actualizar Producto WC',           type: 'main', index: 0 }],  // true
      [{ node: 'Telegram - Producto No Encontrado', type: 'main', index: 0 }]  // false
    ]},
    'Actualizar Producto WC': { main: [[{ node: 'Telegram - Exito Producto', type: 'main', index: 0 }]] }
  };

  console.log('\nCreando workflow en n8n...');
  const result = await apiCall('POST', '/workflows', {
    name: 'FerreteriaYa - Bot Admin Telegram',
    nodes, connections,
    settings: { executionOrder: 'v1' }
  });

  const wfId = result.id || '';
  if (wfId) {
    console.log(`\nEXITO!`);
    console.log(`URL: ${N8N_URL}/workflow/${wfId}`);
    console.log(`ID: ${wfId}`);
    console.log(`\nPasos finales:`);
    console.log(`1. Abre el workflow en n8n y revisa los nodos`);
    console.log(`2. Activa el workflow con el toggle`);
    console.log(`3. Envia un mensaje al bot de Telegram para probar`);
  } else {
    console.log('\nERROR al crear workflow:');
    console.log(JSON.stringify(result).slice(0, 1500));
  }
}

main().catch(console.error);
