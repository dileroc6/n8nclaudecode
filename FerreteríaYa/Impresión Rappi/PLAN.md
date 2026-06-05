# Plan: Automatización Impresión Rappi → Recibo POS

## Contexto

FerreteríaYa recibe pedidos en Rappi Seller Center. Actualmente el operario copia el pedido, va a Siigo POS, busca cada producto manualmente y crea una pre-cuenta para imprimir. Se quiere eliminar ese proceso: pegar el texto del pedido → recibo POS listo para imprimir.

**Entradas definidas:**
- Canal: Formulario web hosteado en n8n
- Salida: HTML imprimible (B&N, formato 80mm POS)
- Incluir: logo FerreteríaYa + identificación Rappi + ID orden (últimos 4 dígitos destacados)
- Flujo: primero aprobar diseño, luego implementar

---

## Fase 0 — Diseño del recibo ✅ APROBADO

Archivo: `receipt-preview.html` — datos de ejemplo con orden 2451583861.

**Referencia de diseño (recibo real FerreteríaYa):**
- Header: logo + FERRETERIAYA SAS + NIT + dirección + teléfono
- Separadores: línea de puntos (`border-bottom: 1px dashed`)
- Items: `1x ProductName   $Precio` (precio a la derecha)
- Totales: label izquierda + valor derecha
- Total final: grande y bold (~24px), con recuadro
- Footer: hora/fecha del pedido

**Datos fijos del negocio:**
```
FERRETERIAYA SAS
NIT: 901574327-4
Dir.: Cra 27 #50-17
Bogotá - tel.3142594984
www.ferreteriaya.com.co
```

---

## Fase 1 — Workflow n8n

**Archivo:** `rappi-print-workflow.json`

**Flujo:**
```
[Form Trigger] → [Preparar Prompt] → [Claude API] → [Parsear JSON] → [Generar HTML] → [Respond to Form]
```

---

### Nodo 1: Form Trigger (`n8n-nodes-base.formTrigger`)

- Título: `FerreteríaYa — Imprimir Pedido Rappi`
- Campo: textarea `pedido_rappi` — *"Pega el texto del pedido Rappi aquí"*
- Botón: `Generar Recibo`
- URL: `https://n8n.srv1398596.hstgr.cloud/form/rappi-print`

---

### Nodo 2: Code — Preparar Prompt

El texto pegado es TODO el contenido visible de la página Rappi (incluye ruido: repartidor, "Empacar productos", "Ver más", etc.). Claude debe ignorar ese ruido.

```js
const texto = $('Form Trigger').item.json.pedido_rappi;
return [{
  json: {
    prompt: `El siguiente texto fue copiado de una página de pedidos de Rappi.
Contiene información irrelevante (nombre del repartidor, texto de botones, etiquetas de sección, etc.).
Extrae SOLO estos datos y devuelve un JSON con esta estructura exacta:
{
  "order_id": "string – ID numérico de la orden (busca 'ID de la orden' o similar)",
  "customer_name": "string – nombre del cliente (busca 'Cliente')",
  "items": [
    {"qty": number, "name": "string – nombre completo del producto", "price": number}
  ],
  "subtotal": number,
  "discount": number,
  "total": number,
  "timestamp": "string – fecha y hora del pedido si aparece, sino null"
}
Reglas:
- Puede haber 1 o muchos productos — extrae TODOS los que encuentres
- Los precios son COP; elimina puntos de miles y símbolos ($, .)
- discount es positivo (luego se muestra como negativo en el recibo)
- Si un campo no aparece, usa null
- Responde SOLO con el JSON, sin explicaciones ni markdown

Texto del pedido:
${texto}`
  }
}];
```

---

### Nodo 3: HTTP Request — Claude Haiku

- URL: `https://api.anthropic.com/v1/messages`
- Method: `POST`
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
- Model: `claude-haiku-4-5-20251001`, `max_tokens: 500`
- Credencial: `ANTHROPIC_API_KEY` del `.env`

---

### Nodo 4: Code — Parsear JSON

Extrae el JSON de la respuesta de Claude y lo deja disponible para el siguiente nodo.

---

### Nodo 5: Code — Generar HTML

Toma el JSON parseado y genera el HTML del recibo usando el diseño aprobado en Fase 0.

---

### Nodo 6: Respond to Form

Devuelve el HTML generado directamente en el navegador para que el operario lo imprima con `Ctrl+P`.
