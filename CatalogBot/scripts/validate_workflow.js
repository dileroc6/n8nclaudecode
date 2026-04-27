#!/usr/bin/env node
'use strict';

/**
 * validate_workflow.js — Valida un JSON de workflow n8n antes de importar
 *
 * Uso:
 *   node scripts/validate_workflow.js workflows/WF-A_receptor.json
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_NAMES = new Set([
  'Start', 'Webhook', 'HTTP Request', 'If', 'Switch', 'Set', 'Function',
  'Code', 'Postgres', 'Wait', 'NoOp', 'Merge', 'Split In Batches',
  'Item Lists', 'Execute Workflow', 'Execute Workflow Trigger',
  'Error Trigger', 'Schedule Trigger', 'Respond to Webhook',
  'HTTP Request1', 'HTTP Request2', 'If1', 'If2', 'Set1', 'Code1',
  'Postgres1', 'Function1', 'Switch1'
]);

const API_KEY_PATTERN = /^[a-zA-Z0-9_\-]{20,}$/;

function looksLikeApiKey(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('{{') || value.startsWith('$')) return false;
  return API_KEY_PATTERN.test(value) && value.length >= 20;
}

function scanForHardcodedSecrets(obj, path = '') {
  const found = [];
  const sensitiveKeys = ['apiKey', 'api_key', 'secret', 'password', 'token', 'authorization'];

  if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        if (looksLikeApiKey(value)) {
          found.push(`Posible credencial hardcodeada en "${currentPath}": "${value.substring(0, 8)}..."`);
        }
      }

      if (typeof value === 'object') {
        found.push(...scanForHardcodedSecrets(value, currentPath));
      }
    }
  }

  return found;
}

function validate(filePath) {
  const errors = [];
  const warnings = [];
  let workflow;

  // Verificar que el archivo existe
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  // Verificar JSON parseable
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    workflow = JSON.parse(content);
  } catch (err) {
    errors.push(`JSON inválido: ${err.message}`);
    return { errors, warnings, nodeCount: 0 };
  }

  const nodes = workflow.nodes || [];
  const nodeNames = nodes.map(n => n.name);

  // Verificar que tiene nodos
  if (nodes.length === 0) {
    errors.push('El workflow no tiene nodos');
    return { errors, warnings, nodeCount: 0 };
  }

  // Verificar nombres descriptivos (no default de n8n)
  for (const node of nodes) {
    if (!node.name) {
      errors.push(`Nodo sin nombre encontrado (tipo: ${node.type})`);
    } else if (DEFAULT_NAMES.has(node.name)) {
      errors.push(`Nodo con nombre default de n8n: "${node.name}" (tipo: ${node.type})`);
    } else if (/^[A-Z][a-z]+\d+$/.test(node.name)) {
      warnings.push(`Nodo con nombre potencialmente default: "${node.name}"`);
    }
  }

  // Verificar nombres únicos
  const nameCounts = {};
  for (const name of nodeNames) {
    nameCounts[name] = (nameCounts[name] || 0) + 1;
  }
  for (const [name, count] of Object.entries(nameCounts)) {
    if (count > 1) {
      errors.push(`Nombre de nodo duplicado: "${name}" (aparece ${count} veces)`);
    }
  }

  // Verificar existencia de nodo Error Trigger
  const hasErrorTrigger = nodes.some(n =>
    n.type === 'n8n-nodes-base.errorTrigger' ||
    n.name.toLowerCase().includes('error') ||
    n.name.toLowerCase().includes('alerta')
  );
  if (!hasErrorTrigger) {
    errors.push('Falta nodo de manejo de errores (Error Trigger o nodo de alerta)');
  }

  // Verificar existencia de al menos un nodo condicional
  const hasConditional = nodes.some(n =>
    n.type === 'n8n-nodes-base.if' ||
    n.type === 'n8n-nodes-base.switch' ||
    n.name.toLowerCase().includes('verificar') ||
    n.name.toLowerCase().includes('validar') ||
    n.name.toLowerCase().includes('comprobar') ||
    n.name.toLowerCase().includes('detectar')
  );
  if (!hasConditional) {
    warnings.push('No se detectó nodo condicional (If/Switch) — verificar si es correcto');
  }

  // Verificar primer nodo (debe ser trigger)
  const triggerKeywords = ['webhook', 'scheduletrigger', 'executeworkflowtrigger', 'errortrigger', 'trigger'];
  const hasTrigger = nodes.some(n => n.type && triggerKeywords.some(k => n.type.toLowerCase().includes(k)));
  if (!hasTrigger) {
    warnings.push('No se detectó nodo trigger — verificar que el primer nodo sea Webhook o Schedule Trigger');
  }

  // Verificar credenciales hardcodeadas
  const secretErrors = scanForHardcodedSecrets(workflow);
  errors.push(...secretErrors);

  return { errors, warnings, nodeCount: nodes.length };
}

function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Uso: node validate_workflow.js <ruta_al_workflow.json>');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  console.log(`\n🔍 Validando: ${path.basename(absolutePath)}\n`);

  const { errors, warnings, nodeCount } = validate(absolutePath);

  if (warnings.length > 0) {
    console.log('⚠️  Advertencias:');
    warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ ERRORES ENCONTRADOS:');
    errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
    console.log(`\n❌ FAIL — ${errors.length} error(es), ${nodeCount} nodo(s)\n`);
    process.exit(1);
  } else {
    console.log(`✅ PASS — ${nodeCount} nodos, 0 errores${warnings.length > 0 ? `, ${warnings.length} advertencia(s)` : ''}\n`);
  }
}

main();
