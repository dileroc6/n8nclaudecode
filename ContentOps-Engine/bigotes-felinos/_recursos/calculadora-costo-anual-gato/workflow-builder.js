// Genera el JSON del workflow one-shot.
// node workflow-builder.js → produce workflow.json

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

// =========================================================================
// CODE NODE: Process Image (Gemini → Buffer)
// =========================================================================
const processImageJs = `
const data = $input.first().json;
const candidate = data?.candidates?.[0];
const finishReason = candidate?.finishReason;
if (finishReason && finishReason !== 'STOP') {
  throw new Error('Gemini rejected the image generation: finishReason=' + finishReason);
}
const part = candidate?.content?.parts?.find(p => p.inlineData);
if (!part?.inlineData?.data) {
  throw new Error('Gemini did not return image data. Response: ' + JSON.stringify(data).slice(0, 500));
}
const base64 = part.inlineData.data;
const mimeType = part.inlineData.mimeType || 'image/png';
const fileName = $('Webhook').first().json.body.image_filename || 'cover.png';
const buffer = Buffer.from(base64, 'base64');
const binaryData = await this.helpers.prepareBinaryData(buffer, fileName, mimeType);
return [{
  json: { fileName, mimeType, size: buffer.length },
  binary: { data: binaryData }
}];
`.trim();

// =========================================================================
// CODE NODE: Build wp_body
// =========================================================================
const buildBodyJs = `
const w = $('Webhook').first().json.body;
const altResp = $input.first().json;
const mediaId = altResp.id;
if (!mediaId) {
  throw new Error('No media_id available from Set Alt Text response');
}

const payload = {
  title: w.title,
  slug: w.slug,
  status: 'publish',
  content: w.content,
  excerpt: w.excerpt || '',
  featured_media: mediaId,
  meta: {
    _yoast_wpseo_title: w.yoast_title,
    _yoast_wpseo_metadesc: w.yoast_metadesc,
    _yoast_wpseo_focuskw: w.yoast_focuskw
  }
};

return [{ json: { wp_body_json: JSON.stringify(payload), media_id: mediaId } }];
`.trim();

// =========================================================================
// CODE NODE: Build Response
// =========================================================================
const buildResponseJs = `
const pageResp = $('Create WP Page').first().json;
const mediaId = $('Build wp_body').first().json.media_id;
return [{
  json: {
    success: true,
    page_id: pageResp.id,
    page_url: pageResp.link,
    page_status: pageResp.status,
    slug: pageResp.slug,
    media_id: mediaId,
    title: pageResp?.title?.rendered || pageResp?.title
  }
}];
`.trim();

// =========================================================================
// WORKFLOW JSON
// =========================================================================

const workflow = {
  name: "BF - WF-Util - Publish Interactive Page (Calculadora)",
  nodes: [
    {
      id: "wfp-001",
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [220, 360],
      parameters: {
        httpMethod: "POST",
        path: "publish-calc-bf",
        responseMode: "lastNode",
        options: {}
      }
    },
    {
      id: "wfp-002",
      name: "Generate Image",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [440, 360],
      parameters: {
        method: "POST",
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "httpHeaderAuth",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ contents: [{ parts: [{ text: $json.body.image_prompt }] }] }) }}",
        options: { timeout: 60000 }
      },
      credentials: {
        httpHeaderAuth: { id: "ysOycTrtxEO3BRcW", name: "BF - BC - nano banana" }
      },
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 5000
    },
    {
      id: "wfp-003",
      name: "Process Image",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [660, 360],
      parameters: {
        mode: "runOnceForAllItems",
        jsCode: processImageJs
      }
    },
    {
      id: "wfp-004",
      name: "Upload to WP Media",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [880, 360],
      parameters: {
        method: "POST",
        url: "https://bigotesfelinos.com/wp-json/wp/v2/media",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "wordpressApi",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Content-Disposition", value: "=attachment; filename=\"{{ $('Process Image').first().json.fileName }}\"" },
            { name: "Content-Type", value: "={{ $('Process Image').first().json.mimeType }}" }
          ]
        },
        sendBody: true,
        contentType: "binaryData",
        inputDataFieldName: "data",
        options: { timeout: 60000 }
      },
      credentials: {
        wordpressApi: { id: "r90z9yKyuuNlhBLy", name: "Wordpress account" }
      }
    },
    {
      id: "wfp-005",
      name: "Set Alt Text",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1100, 360],
      parameters: {
        method: "POST",
        url: "=https://bigotesfelinos.com/wp-json/wp/v2/media/{{ $json.id }}",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "wordpressApi",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify({ alt_text: 'Calculadora del costo anual de tener un gato en Colombia 2026 — flatlay con elementos de cuidado felino', caption: 'Calculadora interactiva del costo anual de un gato en Colombia 2026 — Bigotes Felinos' }) }}",
        options: {}
      },
      credentials: {
        wordpressApi: { id: "r90z9yKyuuNlhBLy", name: "Wordpress account" }
      }
    },
    {
      id: "wfp-006",
      name: "Build wp_body",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1320, 360],
      parameters: {
        mode: "runOnceForAllItems",
        jsCode: buildBodyJs
      }
    },
    {
      id: "wfp-007",
      name: "Create WP Page",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1540, 360],
      parameters: {
        method: "POST",
        url: "https://bigotesfelinos.com/wp-json/wp/v2/pages",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "wordpressApi",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ $json.wp_body_json }}",
        options: { timeout: 60000 }
      },
      credentials: {
        wordpressApi: { id: "r90z9yKyuuNlhBLy", name: "Wordpress account" }
      }
    },
    {
      id: "wfp-008",
      name: "Telegram Notify",
      type: "n8n-nodes-base.telegram",
      typeVersion: 1.2,
      position: [1760, 360],
      parameters: {
        chatId: "1591872862",
        text: "=📊 *Calculadora publicada en producción*\n\n*Página:* {{ $json.title.rendered || $json.title }}\n*URL:* {{ $json.link }}\n*Page ID:* {{ $json.id }}\n*Estado:* {{ $json.status }}\n\n[Ver en GSC →](https://search.google.com/search-console/inspect?resource_id=https://bigotesfelinos.com/&id={{ encodeURIComponent($json.link) }})",
        additionalFields: { parse_mode: "Markdown" }
      },
      credentials: {
        telegramApi: { id: "7iBygAb1uGxktnFH", name: "Telegram BF Bot" }
      }
    },
    {
      id: "wfp-009",
      name: "Build Response",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1980, 360],
      parameters: {
        mode: "runOnceForAllItems",
        jsCode: buildResponseJs
      }
    }
  ],
  connections: {
    "Webhook": { main: [[{ node: "Generate Image", type: "main", index: 0 }]] },
    "Generate Image": { main: [[{ node: "Process Image", type: "main", index: 0 }]] },
    "Process Image": { main: [[{ node: "Upload to WP Media", type: "main", index: 0 }]] },
    "Upload to WP Media": { main: [[{ node: "Set Alt Text", type: "main", index: 0 }]] },
    "Set Alt Text": { main: [[{ node: "Build wp_body", type: "main", index: 0 }]] },
    "Build wp_body": { main: [[{ node: "Create WP Page", type: "main", index: 0 }]] },
    "Create WP Page": { main: [[{ node: "Telegram Notify", type: "main", index: 0 }]] },
    "Telegram Notify": { main: [[{ node: "Build Response", type: "main", index: 0 }]] }
  },
  settings: {
    executionOrder: "v1",
    timezone: "America/Bogota",
    saveManualExecutions: true,
    saveDataErrorExecution: "all",
    saveDataSuccessExecution: "all"
  }
};

fs.writeFileSync(path.join(DIR, 'workflow.json'), JSON.stringify(workflow, null, 2));
console.log('Workflow JSON escrito: ' + (JSON.stringify(workflow).length / 1024).toFixed(1) + ' KB');
console.log('Nodos: ' + workflow.nodes.length);
