#!/usr/bin/env node
'use strict';

/**
 * test_fuzzy_search.js — Tests unitarios para lógica de búsqueda fuzzy
 *
 * Verifica el comportamiento esperado del agente cuando buscar_producto
 * retorna múltiples candidatos con distintos niveles de confianza.
 *
 * Uso: node tests/unit/test_fuzzy_search.js
 */

const resultados = [];

function assert(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  resultados.push({ nombre, ok });
}

// Simula la lógica de normalización de la herramienta buscar_producto
function normalizarQuery(query) {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Simula el cálculo de similitud (Dice coefficient sobre bigramas)
function similitud(a, b) {
  const bigramas = str => {
    const s = normalizarQuery(str);
    const bg = new Set();
    for (let i = 0; i < s.length - 1; i++) bg.add(s[i] + s[i + 1]);
    return bg;
  };
  const bgA = bigramas(a);
  const bgB = bigramas(b);
  if (bgA.size === 0 || bgB.size === 0) return 0;
  let interseccion = 0;
  for (const bg of bgA) if (bgB.has(bg)) interseccion++;
  return (2 * interseccion) / (bgA.size + bgB.size);
}

// Simula la selección de resultado: >= 0.8 → resultado directo, < 0.8 → lista
function seleccionarResultado(query, productos) {
  const scored = productos.map(p => ({
    ...p,
    score: similitud(query, p.nombre)
  })).sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= 0.8) {
    return { tipo: 'directo', producto: scored[0] };
  }
  return { tipo: 'lista', candidatos: scored.slice(0, 5) };
}

console.log('\n🔍 Tests unitarios — Fuzzy search\n');

// --- Tests de normalización ---

assert(
  'normalizarQuery elimina acentos',
  normalizarQuery('Camiséta Azúl') === 'camiseta azul'
);

assert(
  'normalizarQuery convierte a minúsculas',
  normalizarQuery('CAMISETA') === 'camiseta'
);

assert(
  'normalizarQuery recorta espacios',
  normalizarQuery('  camiseta  ') === 'camiseta'
);

// --- Tests de similitud ---

const sim1 = similitud('camiseta azul', 'camiseta azul');
assert('similitud exacta = 1.0', sim1 === 1.0, `score=${sim1.toFixed(3)}`);

const sim2 = similitud('camiseta', 'pantalon');
assert('similitud baja entre productos distintos', sim2 < 0.3, `score=${sim2.toFixed(3)}`);

const sim3 = similitud('camiseta azul m', 'camiseta azul mediana');
assert('similitud alta para variante del mismo producto', sim3 > 0.6, `score=${sim3.toFixed(3)}`);

const sim4 = similitud('camizeta', 'camiseta');
assert('similitud tolera typo (1 carácter)', sim4 > 0.5, `score=${sim4.toFixed(3)}`);

// --- Tests de selección de resultado ---

const productos = [
  { id: '1', nombre: 'Camiseta Azul Talla M' },
  { id: '2', nombre: 'Camiseta Roja Talla L' },
  { id: '3', nombre: 'Pantalón Azul' },
  { id: '4', nombre: 'Camiseta Azul Talla S' },
  { id: '5', nombre: 'Zapato Negro' }
];

const resultado1 = seleccionarResultado('camiseta azul talla m', productos);
assert(
  'búsqueda exacta retorna resultado directo',
  resultado1.tipo === 'directo' && resultado1.producto.id === '1',
  `tipo=${resultado1.tipo}`
);

const resultado2 = seleccionarResultado('camiseta', productos);
assert(
  'búsqueda ambigua retorna lista de candidatos',
  resultado2.tipo === 'lista' && resultado2.candidatos.length > 1,
  `candidatos=${resultado2.candidatos.length}`
);

assert(
  'lista de candidatos ordenada por score descendente',
  resultado2.candidatos[0].score >= resultado2.candidatos[1]?.score,
  `scores=${resultado2.candidatos.slice(0, 3).map(c => c.score.toFixed(2)).join(', ')}`
);

const resultado3 = seleccionarResultado('zapato', productos);
assert(
  'búsqueda con único match relevante retorna resultado directo o lista con ese candidato primero',
  resultado3.candidatos?.[0]?.id === '5' || resultado3.producto?.id === '5',
  `tipo=${resultado3.tipo}`
);

// --- Tests de umbral ---

const scoreAlto = similitud('camiseta azul', 'camiseta azul');
const scoreBajo = similitud('cami', 'camiseta azul');
assert('score >= 0.8 dispara selección directa', scoreAlto >= 0.8, `score=${scoreAlto.toFixed(3)}`);
assert('score < 0.8 dispara lista de candidatos', scoreBajo < 0.8, `score=${scoreBajo.toFixed(3)}`);

// --- Tests de edge cases ---

const resultadoVacio = seleccionarResultado('xyz123', []);
assert(
  'búsqueda en lista vacía retorna lista vacía',
  resultadoVacio.tipo === 'lista' && resultadoVacio.candidatos.length === 0
);

const resultadoUnSolo = seleccionarResultado('zapato negro', [{ id: '5', nombre: 'Zapato Negro' }]);
assert(
  'único producto en catálogo retorna resultado directo si hay match',
  resultadoUnSolo.tipo === 'directo',
  `score=${resultadoUnSolo.producto?.score?.toFixed(3)}`
);

// --- Resumen ---
const total = resultados.length;
const ok = resultados.filter(r => r.ok).length;
const fail = total - ok;
console.log(`\n${ fail === 0 ? '✅' : '❌'} ${ok}/${total} tests pasaron\n`);
process.exit(fail > 0 ? 1 : 0);
