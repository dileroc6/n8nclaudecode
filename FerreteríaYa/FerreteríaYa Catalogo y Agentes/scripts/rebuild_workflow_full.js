const https = require('https');
const crypto = require('crypto');

const N8N_KEY = process.env.N8N_API_KEY;
const TG_CRED   = process.env.N8N_TG_CRED_ID;
const WC_CRED   = process.env.N8N_WC_CRED_ID;
const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
const WP_BASE   = process.env.WP_BASE_URL;
const WP_AUTH   = 'Basic ' + Buffer.from(`${process.env.WP_USER}:${process.env.WP_PASSWORD}`).toString('base64');

const nid = () => crypto.randomUUID();

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el asistente administrador del sitio WordPress ferreteriaya.com.co (ferreteria en Colombia). Responde UNICAMENTE con JSON valido sin markdown.

Si hay URL del sitio, extrae el slug del producto (segmento despues de /producto/).

PRODUCTOS (usa product_sku si hay SKU, product_slug si hay URL, o product_name si hay nombre):
{"action":"update_price","product_sku":"SKU","price":"numero"}
{"action":"update_price","product_slug":"slug","price":"numero"}
{"action":"update_stock","product_sku":"SKU","quantity":numero}
{"action":"update_stock","product_slug":"slug","quantity":numero}
{"action":"update_sale_price","product_sku":"SKU","sale_price":"numero"}
{"action":"update_sale_price","product_slug":"slug","sale_price":"numero"}
{"action":"toggle_product","product_sku":"SKU","status":"publish"}
{"action":"toggle_product","product_slug":"slug","status":"draft"}
{"action":"update_short_description","product_slug":"slug","description":"texto"}
{"action":"get_stock","product_sku":"SKU"}
{"action":"get_stock","product_slug":"slug"}

PEDIDOS:
{"action":"get_orders","limit":5}
{"action":"update_order","order_id":123,"order_status":"completed"}

SITIO Y PAGINAS:
{"action":"update_site_title","title":"nuevo titulo"}
{"action":"update_page_title","current_title":"titulo actual","new_title":"nuevo titulo"}
{"action":"toggle_page","page_title":"titulo","status":"publish"}
{"action":"toggle_page","page_title":"titulo","status":"draft"}
{"action":"toggle_plugin","plugin_slug":"carpeta/archivo.php","active":true}

PRECIOS MASIVOS:
{"action":"bulk_price_change","scope":"category","category_name":"nombre categoria","change_type":"discount","percentage":10}
{"action":"bulk_price_change","scope":"all","change_type":"discount","percentage":10}
{"action":"bulk_price_change","scope":"category","category_name":"nombre","change_type":"increase","percentage":5}
{"action":"bulk_price_change","scope":"all","change_type":"increase","percentage":5}

ADMIN:
{"action":"check_site"}

{"action":"PREGUNTA","message":"pregunta en espanol"}
{"action":"NO_ADMIN","message":"respuesta en espanol"}`;

// ─── CODE STRINGS ─────────────────────────────────────────────────────────────
const CODE_PREPARE = `const msg = $('Telegram Trigger').item.json.message.text || '';
const chatId = $('Telegram Trigger').item.json.message.chat.id;
return {
  chatId,
  claudeBody: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: ${JSON.stringify(SYSTEM_PROMPT)},
    messages: [{ role: 'user', content: msg }]
  })
};`;

const CODE_PARSE = `const resp = $input.item.json;
const chatId = $('Preparar Solicitud').item.json.chatId;
const raw = resp.content && resp.content[0] ? resp.content[0].text.trim() : '';
let p = { action: 'NO_ADMIN', message: raw };
try {
  p = JSON.parse(raw.replace(/^\`\`\`(?:json)?\\n?/,'').replace(/\\n?\`\`\`$/,'').trim());
} catch(e) {}

const sku  = p.product_sku  || '';
const slug = p.product_slug || '';
const name = p.product_name || '';
const searchParam = sku  ? '?sku='    + encodeURIComponent(sku)  + '&per_page=1'
                  : slug ? '?slug='   + encodeURIComponent(slug) + '&per_page=1'
                  :        '?search=' + encodeURIComponent(name) + '&per_page=5';
return {
  chatId,
  action:        p.action || 'NO_ADMIN',
  product_sku:   sku,
  product_slug:  slug,
  product_name:  name,
  searchParam,
  price:         String(p.price || ''),
  sale_price:    String(p.sale_price || ''),
  quantity:      Number(p.quantity || 0),
  product_status:p.status || 'publish',
  description:   p.description || '',
  site_title:    p.title || '',
  current_title: p.current_title || '',
  new_title:     p.new_title || '',
  page_title:    p.page_title || '',
  page_status:   p.status || 'publish',
  plugin_slug:   p.plugin_slug || '',
  plugin_active: p.active !== undefined ? p.active : true,
  order_id:      p.order_id || 0,
  order_status:  p.order_status || '',
  orders_limit:  p.limit || 5,
  bulk_scope:    p.scope || 'all',
  bulk_category: p.category_name || '',
  change_type:   p.change_type || 'discount',
  percentage:    Number(p.percentage || 0),
  message:       p.message || raw
};`;

const CODE_CLASSIFY = `const a = $json.action;
const prod = ['update_price','update_stock','update_sale_price','toggle_product','update_short_description','get_stock'];
const ord  = ['get_orders','update_order'];
const site = ['update_site_title','update_page_title','toggle_page','toggle_plugin'];
let route = 'info';
if (prod.includes(a)) route = 'product';
else if (ord.includes(a)) route = 'orders';
else if (site.includes(a)) route = 'site';
else if (a === 'bulk_price_change') route = 'bulk';
else if (a === 'check_site') route = 'admin';
return { ...$json, route };`;

const CODE_PREP_PRODUCT = `const searchResult = $input.item.json;
const d = $('Clasificar Accion').item.json;
const products = Array.isArray(searchResult) ? searchResult : [searchResult];
const product = products.find(p => p && p.id);
if (!product) return { chatId: d.chatId, found: false, label: d.product_sku || d.product_slug || d.product_name };
let updateBody = null;
let isRead = false;
switch(d.action) {
  case 'update_price':         updateBody = { regular_price: d.price }; break;
  case 'update_stock':         updateBody = { stock_quantity: d.quantity, manage_stock: true }; break;
  case 'update_sale_price':    updateBody = { sale_price: d.sale_price }; break;
  case 'toggle_product':       updateBody = { status: d.product_status }; break;
  case 'update_short_description': updateBody = { short_description: d.description }; break;
  case 'get_stock':            isRead = true; break;
}
return {
  chatId: d.chatId, found: true, isRead,
  productId: product.id, productName: product.name,
  stock: product.stock_quantity,
  currentPrice: product.regular_price,
  currentSalePrice: product.sale_price,
  updateBody: JSON.stringify(updateBody || {}),
  action: d.action, price: d.price, sale_price: d.sale_price,
  quantity: d.quantity, product_status: d.product_status
};`;

const CODE_FORMAT_ORDERS = `const orders = Array.isArray($input.item.json) ? $input.item.json : [$input.item.json];
const chatId = $('Clasificar Accion').item.json.chatId;
const lines = orders.slice(0,10).map(o =>
  \`#\${o.id} | \${o.status} | \${o.billing ? o.billing.first_name+' '+o.billing.last_name : ''} | \$\${o.total}\`
);
return { chatId, message: 'Ultimos pedidos:\\n\\n' + lines.join('\\n') };`;

const CODE_BULK_CALC = `const products = Array.isArray($input.item.json) ? $input.item.json : [$input.item.json];
const d = $('Clasificar Accion').item.json;
const pct = d.percentage / 100;
const updates = products
  .filter(p => p && p.id && p.regular_price)
  .map(p => {
    const orig = parseFloat(p.regular_price) || 0;
    const newP = d.change_type === 'discount' ? orig * (1 - pct) : orig * (1 + pct);
    return { id: p.id, regular_price: Math.round(newP).toString() };
  });
return {
  chatId: d.chatId,
  batchBody: JSON.stringify({ update: updates }),
  count: updates.length,
  scope: d.bulk_scope === 'category' ? d.bulk_category : 'toda la tienda',
  change_type: d.change_type, percentage: d.percentage
};`;

const CODE_FIND_PAGE = `const pages = Array.isArray($input.item.json) ? $input.item.json : [$input.item.json];
const d = $('Clasificar Accion').item.json;
const page = pages.find(p => p && p.id);
if (!page) return { chatId: d.chatId, found: false, label: d.current_title || d.page_title };
let updateBody = {};
if (d.action === 'update_page_title') updateBody = { title: d.new_title };
else if (d.action === 'toggle_page') updateBody = { status: d.page_status };
return { chatId: d.chatId, found: true, pageId: page.id, pageTitle: page.title && page.title.rendered, updateBody: JSON.stringify(updateBody) };`;

// ─── API HELPER ───────────────────────────────────────────────────────────────
function api(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      hostname: 'n8n.srv1398596.hstgr.cloud', port: 443, path,
      method,
      headers: { 'X-N8N-API-KEY': N8N_KEY, ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}) }
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

// ─── NODE FACTORY ─────────────────────────────────────────────────────────────
const tgNode = (name, chatIdExpr, textExpr, pos) => ({
  id: nid(), name, type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: pos,
  parameters: { chatId: chatIdExpr, text: textExpr, additionalFields: {} },
  credentials: { telegramApi: { id: TG_CRED, name: 'Telegram Bot FerreteriaYa' } }
});

const httpGet = (name, url, pos, cred) => ({
  id: nid(), name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos,
  parameters: { method: 'GET', url, ...(cred ? { authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth' } : {}), options: {} },
  ...(cred ? { credentials: { httpBasicAuth: { id: WC_CRED, name: 'WooCommerce FerreteriaYa' } } } : {})
});

const httpPut = (name, url, body, pos, cred) => ({
  id: nid(), name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos,
  parameters: {
    method: 'PUT', url,
    ...(cred === 'wc' ? { authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth' } : {}),
    sendHeaders: true,
    headerParameters: { parameters: cred === 'wp' ? [{ name: 'Authorization', value: WP_AUTH }] : [] },
    sendBody: true, specifyBody: 'json', jsonBody: body, options: {}
  },
  ...(cred === 'wc' ? { credentials: { httpBasicAuth: { id: WC_CRED, name: 'WooCommerce FerreteriaYa' } } } : {})
});

const httpPost = (name, url, body, pos, authType) => ({
  id: nid(), name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos,
  parameters: {
    method: 'POST', url,
    ...(authType === 'wc' ? { authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth' } : {}),
    sendHeaders: true,
    headerParameters: { parameters: authType === 'wp' ? [{ name: 'Authorization', value: WP_AUTH }] : [] },
    sendBody: true, specifyBody: 'json', jsonBody: body, options: {}
  },
  ...(authType === 'wc' ? { credentials: { httpBasicAuth: { id: WC_CRED, name: 'WooCommerce FerreteriaYa' } } } : {})
});

const ifNode = (name, left, right, pos) => ({
  id: nid(), name, type: 'n8n-nodes-base.if', typeVersion: 2, position: pos,
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
      conditions: [{ id: nid(), leftValue: left, rightValue: right, operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and'
    }
  }
});

const codeNode = (name, code, pos) => ({
  id: nid(), name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos,
  parameters: { jsCode: code }
});

// ─── BUILD WORKFLOW ───────────────────────────────────────────────────────────
async function main() {
  const wf = await api('GET', '/api/v1/workflows/EXotNwCwWbg6tg2x');

  // Conservar nodos de autenticación
  const keepNames = ['Telegram Trigger','Verificar Acceso','¿Usuario Autorizado?','Telegram - Responder Acceso'];
  const authNodes = wf.nodes.filter(n => keepNames.includes(n.name));

  // Nodos nuevos
  const nodes = [...authNodes,

    // ── Main flow ──────────────────────────────────────────────────────────
    codeNode('Preparar Solicitud', CODE_PREPARE, [1040, 0]),
    { id: nid(), name: 'Claude API', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1280, 0],
      parameters: { method: 'POST', url: 'https://api.anthropic.com/v1/messages', sendHeaders: true,
        headerParameters: { parameters: [{ name: 'x-api-key', value: ANTHROPIC }, { name: 'anthropic-version', value: '2023-06-01' }] },
        sendBody: true, specifyBody: 'json', jsonBody: '={{ $json.claudeBody }}', options: {} } },
    codeNode('Parsear Respuesta',  CODE_PARSE,    [1520, 0]),
    codeNode('Clasificar Accion',  CODE_CLASSIFY, [1760, 0]),

    // ── IF routing chain ──────────────────────────────────────────────────
    ifNode('¿Es Producto?',  '={{ $json.route }}', 'product', [2000,    0]),
    ifNode('¿Es Pedido?',    '={{ $json.route }}', 'orders',  [2000,  280]),
    ifNode('¿Es Sitio?',     '={{ $json.route }}', 'site',    [2000,  560]),
    ifNode('¿Es Masivo?',    '={{ $json.route }}', 'bulk',    [2000,  840]),
    ifNode('¿Es Admin?',     '={{ $json.route }}', 'admin',   [2000, 1120]),

    // ── Rama PRODUCTO ─────────────────────────────────────────────────────
    httpGet('Buscar Producto WC', `=${WP_BASE}/wp-json/wc/v3/products{{ $json.searchParam }}`, [2300, -200], true),
    codeNode('Prep Producto', CODE_PREP_PRODUCT, [2540, -200]),
    ifNode('¿Producto Hallado?', '={{ $json.found ? "yes" : "no" }}', 'yes', [2780, -200]),
    ifNode('¿Solo Consulta?',    '={{ $json.isRead ? "yes" : "no" }}', 'yes', [3020, -320]),
    httpPut('Actualizar Producto', `=${WP_BASE}/wp-json/wc/v3/products/{{ $json.productId }}`, '={{ $json.updateBody }}', [3260, -400], 'wc'),
    tgNode('TG Producto OK',    "={{ $('Prep Producto').item.json.chatId }}", "=Listo: {{ $('Prep Producto').item.json.productName }}\nAccion: {{ $('Prep Producto').item.json.action }}", [3500, -400]),
    tgNode('TG Stock Info',     "={{ $json.chatId }}", "=📦 {{ $json.productName }}\n💰 Precio: ${{ $json.currentPrice }}{{ $json.currentSalePrice ? '\\nOferta: $' + $json.currentSalePrice : '' }}\n📊 Stock: {{ $json.stock != null ? $json.stock + ' unidades' : 'no gestionado' }}", [3260, -240]),
    tgNode('TG Producto 404',   "={{ $json.chatId }}", "=No encontre el producto \"{{ $json.label }}\". Verifica el nombre.", [3020, -120]),

    // ── Rama PEDIDOS ──────────────────────────────────────────────────────
    ifNode('¿Ver Pedidos?', '={{ $json.action }}', 'get_orders', [2300, 280]),
    httpGet('Get Pedidos', `=${WP_BASE}/wp-json/wc/v3/orders?per_page={{ $json.orders_limit }}&orderby=date&order=desc`, [2540, 160], true),
    codeNode('Format Pedidos', CODE_FORMAT_ORDERS, [2780, 160]),
    tgNode('TG Pedidos', "={{ $json.chatId }}", '={{ $json.message }}', [3020, 160]),
    httpPut('Actualizar Pedido', `=${WP_BASE}/wp-json/wc/v3/orders/{{ $json.order_id }}`, '={{ JSON.stringify({status: $json.order_status}) }}', [2540, 360], 'wc'),
    tgNode('TG Pedido OK', "={{ $('Clasificar Accion').item.json.chatId }}", "=Pedido #{{ $('Clasificar Accion').item.json.order_id }} actualizado a: {{ $('Clasificar Accion').item.json.order_status }}", [2780, 360]),

    // ── Rama SITIO ────────────────────────────────────────────────────────
    ifNode('¿Titulo Sitio?',  '={{ $json.action }}', 'update_site_title', [2300, 560]),
    ifNode('¿Titulo Pagina?', '={{ $json.action }}', 'update_page_title', [2300, 720]),
    ifNode('¿Toggle Pagina?', '={{ $json.action }}', 'toggle_page',       [2300, 880]),

    httpPost('Update Site Title', `${WP_BASE}/wp-json/wp/v2/settings`,
      '={{ JSON.stringify({title: $json.site_title}) }}', [2540, 440], 'wp'),
    tgNode('TG Titulo Sitio OK', "={{ $('Clasificar Accion').item.json.chatId }}", "=Titulo del sitio actualizado a: {{ $('Clasificar Accion').item.json.site_title }}", [2780, 440]),

    httpGet('Buscar Pagina', `=${WP_BASE}/wp-json/wp/v2/pages?search={{ encodeURIComponent($json.current_title || $json.page_title) }}&per_page=5`, [2540, 720], false),
    codeNode('Prep Pagina', CODE_FIND_PAGE, [2780, 720]),
    ifNode('¿Pagina Hallada?', '={{ $json.found ? "yes" : "no" }}', 'yes', [3020, 720]),
    { id: nid(), name: 'Actualizar Pagina', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [3260, 640],
      parameters: { method: 'PUT', url: `=${WP_BASE}/wp-json/wp/v2/pages/{{ $json.pageId }}`,
        sendHeaders: true, headerParameters: { parameters: [{ name: 'Authorization', value: WP_AUTH }] },
        sendBody: true, specifyBody: 'json', jsonBody: '={{ $json.updateBody }}', options: {} } },
    tgNode('TG Pagina OK', "={{ $('Prep Pagina').item.json.chatId }}", "=Pagina actualizada: {{ $('Prep Pagina').item.json.pageTitle }}", [3500, 640]),
    tgNode('TG Pagina 404', "={{ $json.chatId }}", "=No encontre la pagina \"{{ $json.label }}\".", [3260, 800]),

    { id: nid(), name: 'Toggle Plugin', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [2540, 1000],
      parameters: { method: 'PUT', url: `=${WP_BASE}/wp-json/wp/v2/plugins/{{ encodeURIComponent($json.plugin_slug) }}`,
        sendHeaders: true, headerParameters: { parameters: [{ name: 'Authorization', value: WP_AUTH }] },
        sendBody: true, specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({status: $json.plugin_active ? "active" : "inactive"}) }}', options: {} } },
    tgNode('TG Plugin OK', "={{ $('Clasificar Accion').item.json.chatId }}", "=Plugin {{ $('Clasificar Accion').item.json.plugin_slug }} {{ $('Clasificar Accion').item.json.plugin_active ? 'activado' : 'desactivado' }}", [2780, 1000]),

    // ── Rama MASIVO ───────────────────────────────────────────────────────
    ifNode('¿Masivo Categoria?', '={{ $json.bulk_scope }}', 'category', [2300, 1200]),
    httpGet('Get Categoria', `=${WP_BASE}/wp-json/wc/v3/products/categories?search={{ encodeURIComponent($json.bulk_category) }}&per_page=5`, [2540, 1120], true),
    httpGet('Get Productos Categoria', `=${WP_BASE}/wp-json/wc/v3/products?category={{ $input.item.json[0] ? $input.item.json[0].id : ($input.item.json.id || '') }}&per_page=100`, [2780, 1120], true),
    httpGet('Get Todos Productos', `=${WP_BASE}/wp-json/wc/v3/products?per_page=100&status=publish`, [2540, 1320], true),
    codeNode('Calc Precios', CODE_BULK_CALC, [3020, 1200]),
    httpPost('Batch Update Precios', `${WP_BASE}/wp-json/wc/v3/products/batch`, '={{ $json.batchBody }}', [3260, 1200], 'wc'),
    tgNode('TG Masivo OK', "={{ $('Calc Precios').item.json.chatId }}", "=Listo! {{ $('Calc Precios').item.json.change_type === 'discount' ? 'Descuento' : 'Aumento' }} del {{ $('Calc Precios').item.json.percentage }}% aplicado a {{ $('Calc Precios').item.json.count }} productos de {{ $('Calc Precios').item.json.scope }}", [3500, 1200]),

    // ── Rama ADMIN ────────────────────────────────────────────────────────
    httpGet('Check Site', WP_BASE, [2300, 1480], false),
    tgNode('TG Site OK',   "={{ $('Clasificar Accion').item.json.chatId }}", '=El sitio ferreteriaya.com.co esta en linea y funcionando correctamente.', [2540, 1400]),
    tgNode('TG Site Down', "={{ $('Clasificar Accion').item.json.chatId }}", '=Alerta: el sitio podria tener problemas de acceso.', [2540, 1560]),

    // ── Info / fallback ────────────────────────────────────────────────────
    tgNode('TG Info', "={{ $json.chatId }}", '={{ $json.message }}', [2300, 1700]),
  ];

  // ─── CONNECTIONS ──────────────────────────────────────────────────────────
  const conn = {
    'Telegram Trigger':       { main: [[{ node: 'Verificar Acceso',        type:'main', index:0 }]] },
    'Verificar Acceso':       { main: [[{ node: '¿Usuario Autorizado?',    type:'main', index:0 }]] },
    '¿Usuario Autorizado?':   { main: [
      [{ node: 'Preparar Solicitud', type:'main', index:0 }],
      [{ node: 'Telegram - Responder Acceso', type:'main', index:0 }]
    ]},
    'Preparar Solicitud':     { main: [[{ node: 'Claude API',        type:'main', index:0 }]] },
    'Claude API':             { main: [[{ node: 'Parsear Respuesta', type:'main', index:0 }]] },
    'Parsear Respuesta':      { main: [[{ node: 'Clasificar Accion', type:'main', index:0 }]] },
    'Clasificar Accion':      { main: [[{ node: '¿Es Producto?',     type:'main', index:0 }]] },

    // routing chain
    '¿Es Producto?':  { main: [[{ node:'Buscar Producto WC',  type:'main',index:0}], [{node:'¿Es Pedido?',     type:'main',index:0}]] },
    '¿Es Pedido?':    { main: [[{ node:'¿Ver Pedidos?',       type:'main',index:0}], [{node:'¿Es Sitio?',      type:'main',index:0}]] },
    '¿Es Sitio?':     { main: [[{ node:'¿Titulo Sitio?',      type:'main',index:0}], [{node:'¿Es Masivo?',     type:'main',index:0}]] },
    '¿Es Masivo?':    { main: [[{ node:'¿Masivo Categoria?',  type:'main',index:0}], [{node:'¿Es Admin?',      type:'main',index:0}]] },
    '¿Es Admin?':     { main: [[{ node:'Check Site',          type:'main',index:0}], [{node:'TG Info',         type:'main',index:0}]] },

    // productos
    'Buscar Producto WC':     { main: [[{ node:'Prep Producto', type:'main',index:0}]] },
    'Prep Producto':          { main: [[{ node:'¿Producto Hallado?', type:'main',index:0}]] },
    '¿Producto Hallado?':     { main: [[{node:'¿Solo Consulta?',type:'main',index:0}],[{node:'TG Producto 404',type:'main',index:0}]] },
    '¿Solo Consulta?':        { main: [[{node:'TG Stock Info',type:'main',index:0}],[{node:'Actualizar Producto',type:'main',index:0}]] },
    'Actualizar Producto':    { main: [[{ node:'TG Producto OK', type:'main',index:0}]] },

    // pedidos
    '¿Ver Pedidos?':          { main: [[{node:'Get Pedidos',type:'main',index:0}],[{node:'Actualizar Pedido',type:'main',index:0}]] },
    'Get Pedidos':            { main: [[{node:'Format Pedidos', type:'main',index:0}]] },
    'Format Pedidos':         { main: [[{node:'TG Pedidos',     type:'main',index:0}]] },
    'Actualizar Pedido':      { main: [[{node:'TG Pedido OK',   type:'main',index:0}]] },

    // sitio
    '¿Titulo Sitio?':         { main: [[{node:'Update Site Title',type:'main',index:0}],[{node:'¿Titulo Pagina?',type:'main',index:0}]] },
    '¿Titulo Pagina?':        { main: [[{node:'Buscar Pagina',type:'main',index:0}],[{node:'¿Toggle Pagina?',type:'main',index:0}]] },
    '¿Toggle Pagina?':        { main: [[{node:'Buscar Pagina',type:'main',index:0}],[{node:'Toggle Plugin',type:'main',index:0}]] },
    'Update Site Title':      { main: [[{node:'TG Titulo Sitio OK',type:'main',index:0}]] },
    'Buscar Pagina':          { main: [[{node:'Prep Pagina',type:'main',index:0}]] },
    'Prep Pagina':            { main: [[{node:'¿Pagina Hallada?',type:'main',index:0}]] },
    '¿Pagina Hallada?':       { main: [[{node:'Actualizar Pagina',type:'main',index:0}],[{node:'TG Pagina 404',type:'main',index:0}]] },
    'Actualizar Pagina':      { main: [[{node:'TG Pagina OK',type:'main',index:0}]] },
    'Toggle Plugin':          { main: [[{node:'TG Plugin OK',type:'main',index:0}]] },

    // masivo
    '¿Masivo Categoria?':     { main: [[{node:'Get Categoria',type:'main',index:0}],[{node:'Get Todos Productos',type:'main',index:0}]] },
    'Get Categoria':          { main: [[{node:'Get Productos Categoria',type:'main',index:0}]] },
    'Get Productos Categoria':{ main: [[{node:'Calc Precios',type:'main',index:0}]] },
    'Get Todos Productos':    { main: [[{node:'Calc Precios',type:'main',index:0}]] },
    'Calc Precios':           { main: [[{node:'Batch Update Precios',type:'main',index:0}]] },
    'Batch Update Precios':   { main: [[{node:'TG Masivo OK',type:'main',index:0}]] },

    // admin
    'Check Site':             { main: [[{node:'TG Site OK',type:'main',index:0}],[{node:'TG Site Down',type:'main',index:0}]] },
  };

  const result = await api('PUT', '/api/v1/workflows/EXotNwCwWbg6tg2x', {
    name: 'FerreteriaYa - Bot Admin Telegram',
    nodes, connections: conn,
    settings: { executionOrder: 'v1' }
  });

  console.log(result.id
    ? `\nOK: workflow reconstruido (${nodes.length} nodos)`
    : '\nERROR: ' + JSON.stringify(result).slice(0, 500));
}

main().catch(console.error);
