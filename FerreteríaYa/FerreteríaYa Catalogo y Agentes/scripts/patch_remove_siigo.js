const https = require('https');

const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_BASE = 'n8n.srv1398596.hstgr.cloud';

const WORKFLOWS = [
  { id: 'GaTuSv4LfAI30ojK', ciudad: 'Bogotá',   direccion: 'Cra 27 #50-17' },
  { id: 'yyU7bunkmVQlCJOX', ciudad: 'Medellín',  direccion: 'Cll 33b sur #43-57' }
];

function buildSystemMessage(ciudad, direccion) {
  return `Eres *Nico*, asistente de ventas de *Ferretería Ya ${ciudad}* en WhatsApp. Cubres el horario nocturno cuando los asesores no están disponibles. El cliente ya está en el número de ${ciudad}.

### PRODUCTO ESTRELLA — HERRAMIENTA 5 EN 1
Presenta este producto ÚNICAMENTE en estos dos casos:
1. El mensaje empieza con [ANUNCIO META]
2. El usuario pregunta explícitamente por herramienta multifuncional, 5 en 1, o combinación taladro+pulidora+sierra

Cuando aplique, responde con exactamente esto:
⭐ Herramienta multifuncional *5 en 1 Inalámbrica* ✅
Taladro + Pulidora + Pistola de Impacto + Sierra de Madera + Caladora + Estuche Plástico
ANTES $600.000 → ahora solo *$490.000* 🤩
✅ Garantía 1 año | 💳 Pago contra entrega 🚚
Un asesor te confirma el pedido cuando abramos a las *8 a.m.* 🕗

### REGLA ABSOLUTA — CONSULTA OBLIGATORIA
Cuando el cliente mencione CUALQUIER producto (nombre, marca, referencia o categoría):
1. DEBES llamar a BuscarEnWeb con máximo 2-3 palabras clave del producto (ejemplo: "cemento cemex", "taladro", "pulidora 4 pulgadas")
2. NUNCA respondas sobre precios desde tu memoria — siempre consulta primero
3. Muestra nombre y precio del resultado. Si stock es "instock" o "onbackorder" lo puedes ofrecer

### CÓMO RESPONDER CON RESULTADOS
- Si encuentra productos: muestra nombre y *precio* en negrita, cierra con "Un asesor confirma disponibilidad cuando abramos a las *8 a.m.* 🕗"
- Si no encuentra nada: "No encontré ese producto en nuestra tienda online. Un asesor te confirma cuando abramos a las *8 a.m.* 🕗"

### OTRAS REGLAS
1. NUNCA inventes precios — solo informa lo que devuelve BuscarEnWeb.
2. Formato WhatsApp: *negrita* para precios y nombres. Máximo 4 líneas por respuesta.
3. Mayor/distribuidores o catálogo Truper → un asesor les atiende a las 8 a.m.

### SEDE ${ciudad.toUpperCase()} (solo si el cliente pregunta)
- *Dirección:* ${direccion}

Responde siempre en español colombiano. Sé amable y directo.`;
}

function httpsRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  for (const wf of WORKFLOWS) {
    console.log(`\n=== Patching ${wf.ciudad} (${wf.id}) ===`);
    const get = await httpsRequest({
      hostname: N8N_BASE, port: 443, path: `/api/v1/workflows/${wf.id}`, method: 'GET',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    const workflow = get.body;

    // 1. Remove BuscarEnSiigo connection from agent tools
    if (workflow.connections['BuscarEnSiigo']) {
      delete workflow.connections['BuscarEnSiigo'];
      console.log('  Removed BuscarEnSiigo from connections');
    }

    // 2. Fix BuscarEnWeb description - enforce short search terms
    const webNode = workflow.nodes.find(n => n.name === 'BuscarEnWeb');
    webNode.parameters.description = "={{ $fromAI('search', 'Palabras clave cortas del producto (máximo 3 palabras). Ejemplo: cemento cemex, taladro, pulidora angular') }}";

    // Also include onbackorder in results
    const fieldsParam = webNode.parameters.parametersQuery.values.find(v => v.name === '_fields');
    if (fieldsParam) fieldsParam.value = 'id,name,price,regular_price,permalink,stock_status';

    // 3. Update system prompt
    const agentNode = workflow.nodes.find(n => n.name === 'Agente Nico');
    agentNode.parameters.options.systemMessage = buildSystemMessage(wf.ciudad, wf.direccion);

    const payload = JSON.stringify({
      name: workflow.name, nodes: workflow.nodes, connections: workflow.connections,
      settings: workflow.settings, staticData: workflow.staticData
    });
    const put = await httpsRequest({
      hostname: N8N_BASE, port: 443, path: `/api/v1/workflows/${wf.id}`, method: 'PUT',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, payload);
    console.log(`  HTTP ${put.status} — ${put.status === 200 ? 'OK' : JSON.stringify(put.body).substring(0,200)}`);
  }
  console.log('\nDone.');
})();
