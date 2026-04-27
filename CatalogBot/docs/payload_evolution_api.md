# Referencia del payload — Evolution API v2

## Evento principal: messages.upsert

Este es el evento que llega al webhook de WF-A para cada mensaje entrante.

### Payload completo (mensaje de texto)

```json
{
  "event": "messages.upsert",
  "instance": "nombre_instancia",
  "data": {
    "key": {
      "remoteJid": "573001234567@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0A12345ABCDEF"
    },
    "pushName": "Nombre del Usuario",
    "messageType": "conversation",
    "message": {
      "conversation": "Texto del mensaje aquí"
    },
    "messageTimestamp": 1713000000,
    "instanceId": "abc123",
    "serverUrl": "https://evolution.tudominio.com",
    "apiKey": "tu_api_key"
  }
}
```

### Payload: mensaje con texto enriquecido

```json
{
  "data": {
    "messageType": "extendedTextMessage",
    "message": {
      "extendedTextMessage": {
        "text": "Texto del mensaje aquí",
        "contextInfo": {}
      }
    }
  }
}
```

### Payload: imagen con caption

```json
{
  "data": {
    "messageType": "imageMessage",
    "message": {
      "imageMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "mimetype": "image/jpeg",
        "caption": "texto que acompaña la imagen",
        "fileLength": "123456",
        "height": 1080,
        "width": 1920,
        "mediaKey": "abc123==",
        "directPath": "/v/t62.7118-24/..."
      }
    }
  }
}
```

### Payload: audio

```json
{
  "data": {
    "messageType": "audioMessage",
    "message": {
      "audioMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "mimetype": "audio/ogg; codecs=opus",
        "fileLength": "45678",
        "seconds": 12,
        "ptt": true
      }
    }
  }
}
```

### Payload: documento/PDF

```json
{
  "data": {
    "messageType": "documentMessage",
    "message": {
      "documentMessage": {
        "url": "https://mmg.whatsapp.net/...",
        "mimetype": "application/pdf",
        "title": "nombre_archivo.pdf",
        "fileLength": "789000"
      }
    }
  }
}
```

---

## Reglas de extracción en WF-A

| Dato necesario | Cómo extraerlo |
|---|---|
| Número del remitente | `body.data.key.remoteJid` → reemplazar `@s.whatsapp.net` con `""` |
| Es mensaje propio | `body.data.key.fromMe === true` → ignorar |
| Nombre de la instancia | `body.instance` → buscar en `public.clientes.whatsapp_instance` |
| Tipo de mensaje | `body.data.messageType` |
| Texto (tipo conversation) | `body.data.message.conversation` |
| Texto (tipo extendedText) | `body.data.message.extendedTextMessage.text` |
| Caption de imagen | `body.data.message.imageMessage.caption` (puede ser null) |

---

## Descarga de imagen

Para obtener el base64 de una imagen recibida:

```
POST {EVOLUTION_URL}/chat/getBase64FromMediaMessage/{instance}
Headers:
  apikey: {EVOLUTION_API_KEY}
  Content-Type: application/json

Body:
{
  "message": {
    "key": body.data.key,
    "message": body.data.message
  }
}

Respuesta exitosa:
{
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
  "mimetype": "image/jpeg"
}
```

**Importante:** La URL de media de WhatsApp expira en ~5 minutos.
Si el request falla con 404, pedirle al usuario que reenvíe la imagen.

---

## Envío de respuesta al usuario

```
POST {EVOLUTION_URL}/message/sendText/{instance}
Headers:
  apikey: {EVOLUTION_API_KEY}
  Content-Type: application/json

Body:
{
  "number": "573001234567",
  "text": "Respuesta del bot aquí"
}
```

**Límite de texto:** ~4096 caracteres por mensaje de WhatsApp.

---

## Tipos de mensaje y manejo en WF-A

| messageType | Manejo |
|---|---|
| `conversation` | Extraer texto de `message.conversation` |
| `extendedTextMessage` | Extraer texto de `message.extendedTextMessage.text` |
| `imageMessage` | Descargar base64 via API → enviar a WF-B |
| `audioMessage` | Responder: "Por ahora solo proceso texto e imágenes." |
| `documentMessage` | Responder: "No puedo procesar PDFs." |
| `stickerMessage` | Ignorar silenciosamente (no responder) |
| `reactionMessage` | Ignorar silenciosamente |
| `locationMessage` | Responder: "Por ahora solo proceso texto e imágenes." |
| cualquier otro | Log en errores; no responder |
