const fs = require('fs');
const https = require('https');

const N8N_KEY = process.env.N8N_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `Eres el asistente administrador del sitio WordPress ferreteriaya.com.co. Cuando el usuario te de una instruccion, responde UNICAMENTE con un objeto JSON valido, sin markdown ni texto adicional.

Si el usuario incluye una URL del sitio (ej: https://ferreteriaya.com.co/producto/nombre-del-producto/), extrae el slug del producto (el segmento despues de /producto/) y usalo en product_slug.

Acciones:

Con URL: {"action":"update_price","product_slug":"slug-extraido-de-url","price":"numero"}
Sin URL: {"action":"update_price","product_name":"nombre del producto","price":"numero"}

Con URL: {"action":"update_stock","product_slug":"slug-extraido-de-url","quantity":numero}
Sin URL: {"action":"update_stock","product_name":"nombre del producto","quantity":numero}

Titulo: {"action":"update_site_title","title":"nuevo titulo"}

Pregunta: {"action":"PREGUNTA","message":"pregunta en espanol"}

No admin: {"action":"NO_ADMIN","message":"respuesta en espanol"}

SOLO JSON valido. Sin comillas simples. Sin markdown.`;

const PREPARE_CODE = `const msg = $input.item.json.message.text || '';
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

const PARSE_CODE = `const resp = $input.item.json;
const chatId = $('Preparar Solicitud').item.json.chatId;
const raw = resp.content && resp.content[0] ? resp.content[0].text.trim() : '';
let parsed = { action: 'NO_ADMIN', message: raw };
try {
  const clean = raw.replace(/^\`\`\`(?:json)?\\n?/, '').replace(/\\n?\`\`\`$/, '').trim();
  parsed = JSON.parse(clean);
} catch(e) {}

const slug = parsed.product_slug || '';
const name = parsed.product_name || '';
const searchParam = slug
  ? '?slug=' + encodeURIComponent(slug) + '&per_page=1'
  : '?search=' + encodeURIComponent(name) + '&per_page=5';

return {
  chatId,
  action: parsed.action || 'NO_ADMIN',
  product_name: name,
  product_slug: slug,
  searchParam,
  price: String(parsed.price || ''),
  quantity: Number(parsed.quantity || 0),
  site_title: parsed.title || '',
  message: parsed.message || raw
};`;

const BUILD_UPDATE_CODE = `const searchResult = $input.item.json;
const claudeData = $('Parsear Respuesta').item.json;
const chatId = claudeData.chatId;

const products = Array.isArray(searchResult) ? searchResult : (searchResult.data || [searchResult]);
const product = products.find(p => p && p.id);

if (!product) {
  return { chatId, found: false, product_name: claudeData.product_slug || claudeData.product_name };
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

function apiCall(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      hostname: 'n8n.srv1398596.hstgr.cloud', port: 443, path,
      method,
      headers: {
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
  // Obtener workflow actual
  const wf = await apiCall('GET', '/api/v1/workflows/EXotNwCwWbg6tg2x');

  // 1. Actualizar code de Preparar Solicitud
  const prepNode = wf.nodes.find(n => n.name === 'Preparar Solicitud');
  prepNode.parameters.jsCode = PREPARE_CODE;
  console.log('Preparar Solicitud: OK');

  // 2. Actualizar code de Parsear Respuesta
  const parseNode = wf.nodes.find(n => n.name === 'Parsear Respuesta');
  parseNode.parameters.jsCode = PARSE_CODE;
  console.log('Parsear Respuesta: OK');

  // 3. Actualizar URL de Buscar Producto WC (dinamica con searchParam)
  const searchNode = wf.nodes.find(n => n.name === 'Buscar Producto WC');
  searchNode.parameters.url = '=https://ferreteriaya.com.co/wp-json/wc/v3/products{{ $json.searchParam }}';
  searchNode.parameters.sendQuery = false;
  delete searchNode.parameters.queryParameters;
  console.log('Buscar Producto WC URL: OK');

  // 4. Actualizar code de Preparar Update
  const buildNode = wf.nodes.find(n => n.name === 'Preparar Update');
  buildNode.parameters.jsCode = BUILD_UPDATE_CODE;
  console.log('Preparar Update: OK');

  // 5. Confirmar URL de Actualizar Producto WC
  const updateNode = wf.nodes.find(n => n.name === 'Actualizar Producto WC');
  updateNode.parameters.url = '=https://ferreteriaya.com.co/wp-json/wc/v3/products/{{ $json.productId }}';
  console.log('Actualizar Producto WC URL: OK');

  // PUT
  const result = await apiCall('PUT', '/api/v1/workflows/EXotNwCwWbg6tg2x', {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || {}
  });

  console.log(result.id ? '\nWorkflow actualizado: ' + result.id : '\nERROR: ' + JSON.stringify(result).slice(0, 400));
}

main().catch(console.error);
