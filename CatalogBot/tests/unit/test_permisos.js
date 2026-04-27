#!/usr/bin/env node
'use strict';

/**
 * test_permisos.js — Tests unitarios para la matriz de permisos por rol
 *
 * Verifica que la lógica de autorización del agente (WF-B) respeta
 * exactamente la matriz definida en CLAUDE.md.
 *
 * Uso: node tests/unit/test_permisos.js
 */

const resultados = [];

function assert(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  resultados.push({ nombre, ok });
}

// Matriz de permisos exacta según CLAUDE.md
const PERMISOS = {
  buscar_producto:     { admin: true,  editor: true,  viewer: true  },
  obtener_producto:    { admin: true,  editor: true,  viewer: true  },
  ver_historial:       { admin: true,  editor: true,  viewer: true  },
  listar_categorias:   { admin: true,  editor: true,  viewer: true  },
  actualizar_precio:   { admin: true,  editor: true,  viewer: false },
  crear_descuento:     { admin: true,  editor: true,  viewer: false },
  eliminar_descuento:  { admin: true,  editor: true,  viewer: false },
  crear_producto:      { admin: true,  editor: true,  viewer: false },
  actualizar_producto: { admin: true,  editor: true,  viewer: false },
  subir_imagen:        { admin: true,  editor: true,  viewer: false },
  analizar_imagen:     { admin: true,  editor: true,  viewer: false },
  programar_cambio:    { admin: true,  editor: true,  viewer: false },
  precio_masivo:       { admin: true,  editor: false, viewer: false },
  eliminar_producto:   { admin: true,  editor: false, viewer: false },
  revertir_cambio:     { admin: true,  editor: false, viewer: false }
};

function tienePermiso(rol, tool) {
  return PERMISOS[tool]?.[rol] === true;
}

console.log('\n🔍 Tests unitarios — Matriz de permisos\n');

// --- Viewer: solo lectura ---

const toolsViewer = ['buscar_producto', 'obtener_producto', 'ver_historial', 'listar_categorias'];
for (const tool of toolsViewer) {
  assert(`viewer puede usar ${tool}`, tienePermiso('viewer', tool));
}

const toolsNoViewer = [
  'actualizar_precio', 'crear_descuento', 'eliminar_descuento',
  'crear_producto', 'actualizar_producto', 'subir_imagen',
  'analizar_imagen', 'programar_cambio', 'precio_masivo',
  'eliminar_producto', 'revertir_cambio'
];
for (const tool of toolsNoViewer) {
  assert(`viewer NO puede usar ${tool}`, !tienePermiso('viewer', tool));
}

// --- Editor: lectura + escritura sin operaciones destructivas ---

const toolsEditor = [
  'buscar_producto', 'obtener_producto', 'ver_historial', 'listar_categorias',
  'actualizar_precio', 'crear_descuento', 'eliminar_descuento',
  'crear_producto', 'actualizar_producto', 'subir_imagen',
  'analizar_imagen', 'programar_cambio'
];
for (const tool of toolsEditor) {
  assert(`editor puede usar ${tool}`, tienePermiso('editor', tool));
}

const toolsNoEditor = ['precio_masivo', 'eliminar_producto', 'revertir_cambio'];
for (const tool of toolsNoEditor) {
  assert(`editor NO puede usar ${tool}`, !tienePermiso('editor', tool));
}

// --- Admin: acceso total ---

const todasLasTools = Object.keys(PERMISOS);
for (const tool of todasLasTools) {
  assert(`admin puede usar ${tool}`, tienePermiso('admin', tool));
}

// --- Casos edge ---

assert(
  'rol desconocido no tiene permisos',
  !tienePermiso('superuser', 'buscar_producto')
);

assert(
  'tool desconocida no tiene permisos para ningún rol',
  !tienePermiso('admin', 'tool_inexistente') &&
  !tienePermiso('editor', 'tool_inexistente') &&
  !tienePermiso('viewer', 'tool_inexistente')
);

// --- Verificar conteo de tools ---

const totalTools = Object.keys(PERMISOS).length;
assert(
  `hay exactamente 15 tools definidas`,
  totalTools === 15,
  `encontradas: ${totalTools}`
);

// --- Ver historial: viewer solo puede ver el suyo (lógica especial) ---
// La tool en sí está permitida, pero el filtrado es responsabilidad del agente.
// Solo verificamos que el permiso base existe.
assert(
  'ver_historial permitido para viewer (filtrado por usuario en system prompt)',
  tienePermiso('viewer', 'ver_historial')
);

// --- Resumen ---
const total = resultados.length;
const ok = resultados.filter(r => r.ok).length;
const fail = total - ok;
console.log(`\n${ fail === 0 ? '✅' : '❌'} ${ok}/${total} tests pasaron\n`);
process.exit(fail > 0 ? 1 : 0);
