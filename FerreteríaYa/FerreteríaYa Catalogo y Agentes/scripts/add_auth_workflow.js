const https = require('https');
const crypto = require('crypto');

const N8N_KEY = process.env.N8N_API_KEY;
const TELEGRAM_CRED_ID = process.env.N8N_TG_CRED_ID;

const VERIFY_CODE = `const msg = $input.item.json.message.text || '';
const userId = $input.item.json.message.from.id;
const chatId = $input.item.json.message.chat.id;
const PASSWORD = '*FerFerreteriaNicoFabi2026';

const staticData = $getWorkflowStaticData('global');
if (!staticData.authorizedUsers) staticData.authorizedUsers = [];

if (msg.startsWith('/auth ')) {
  const provided = msg.slice(6).trim();
  if (provided === PASSWORD) {
    if (!staticData.authorizedUsers.includes(userId)) {
      staticData.authorizedUsers.push(userId);
    }
    return { chatId, userId, status: 'auth_ok', message: 'Acceso concedido. Ya puedes dar instrucciones al bot.' };
  } else {
    return { chatId, userId, status: 'auth_fail', message: 'Clave incorrecta. Intenta de nuevo con /auth CLAVE' };
  }
}

if (staticData.authorizedUsers.includes(userId)) {
  return { chatId, userId, status: 'continue' };
}

return { chatId, userId, status: 'unauthorized', message: 'No tienes acceso. Envia: /auth CLAVE' };`;

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
  const wf = await apiCall('GET', '/api/v1/workflows/EXotNwCwWbg6tg2x');
  console.log('Workflow obtenido:', wf.name);

  // Actualizar Preparar Solicitud para leer desde Telegram Trigger directamente
  const prepNode = wf.nodes.find(n => n.name === 'Preparar Solicitud');
  const oldPrepCode = prepNode.parameters.jsCode;
  prepNode.parameters.jsCode = oldPrepCode
    .replace("$input.item.json.message.text", "$('Telegram Trigger').item.json.message.text")
    .replace("$input.item.json.message.chat.id", "$('Telegram Trigger').item.json.message.chat.id");
  console.log('Preparar Solicitud actualizado para leer desde Telegram Trigger');

  // Nodo 1: Verificar Acceso (Code)
  const verifyId = crypto.randomUUID();
  const verifyNode = {
    id: verifyId,
    name: 'Verificar Acceso',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [240, 0],
    parameters: { jsCode: VERIFY_CODE }
  };

  // Nodo 2: IF ¿Continuar?
  const ifId = crypto.randomUUID();
  const ifNode = {
    id: ifId,
    name: '¿Usuario Autorizado?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    position: [480, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          id: crypto.randomUUID(),
          leftValue: '={{ $json.status }}',
          rightValue: 'continue',
          operator: { type: 'string', operation: 'equals' }
        }],
        combinator: 'and'
      }
    }
  };

  // Nodo 3: Telegram - Responder Acceso
  const tgAccessId = crypto.randomUUID();
  const tgAccessNode = {
    id: tgAccessId,
    name: 'Telegram - Responder Acceso',
    type: 'n8n-nodes-base.telegram',
    typeVersion: 1.2,
    position: [480, 200],
    parameters: {
      chatId: '={{ $json.chatId }}',
      text: '={{ $json.message }}',
      additionalFields: {}
    },
    credentials: { telegramApi: { id: TELEGRAM_CRED_ID, name: 'Telegram Bot FerreteriaYa' } }
  };

  // Agregar los nuevos nodos
  wf.nodes.push(verifyNode, ifNode, tgAccessNode);

  // Mover nodos existentes a la derecha para hacer espacio
  const newNodesToShift = ['Preparar Solicitud', 'Claude API', 'Parsear Respuesta',
    'Es Accion Producto?', 'Es Accion Sitio?', 'Buscar Producto WC', 'Preparar Update',
    'Producto Encontrado?', 'Actualizar Producto WC', 'Telegram - Exito Producto',
    'Telegram - Exito Titulo', 'Telegram - Producto No Encontrado', 'Telegram - Info',
    'Actualizar Titulo Sitio'];
  wf.nodes.forEach(n => {
    if (newNodesToShift.includes(n.name)) {
      n.position = [n.position[0] + 500, n.position[1]];
    }
  });

  // Actualizar conexiones
  // Telegram Trigger → Verificar Acceso (en vez de Preparar Solicitud)
  wf.connections['Telegram Trigger'] = {
    main: [[{ node: 'Verificar Acceso', type: 'main', index: 0 }]]
  };
  // Verificar Acceso → IF
  wf.connections['Verificar Acceso'] = {
    main: [[{ node: '¿Usuario Autorizado?', type: 'main', index: 0 }]]
  };
  // IF: true → Preparar Solicitud, false → Telegram Responder Acceso
  wf.connections['¿Usuario Autorizado?'] = {
    main: [
      [{ node: 'Preparar Solicitud', type: 'main', index: 0 }],
      [{ node: 'Telegram - Responder Acceso', type: 'main', index: 0 }]
    ]
  };

  const result = await apiCall('PUT', '/api/v1/workflows/EXotNwCwWbg6tg2x', {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || {}
  });

  console.log(result.id ? '\nOK: sistema de clave agregado al workflow' : '\nERROR: ' + JSON.stringify(result).slice(0, 400));
}

main().catch(console.error);
