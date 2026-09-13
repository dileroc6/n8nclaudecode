// ============================================================================
// ¿Los 58 archivos de esquema se pueden volver a correr sin romper nada?
// ----------------------------------------------------------------------------
// La regla del proyecto es que TODO esquema es idempotente: correrlo dos veces
// tiene que dar lo mismo que correrlo una. De eso depende poder arreglar algo
// sin miedo, y poder levantar la base de cero el día que haga falta.
//
// Pero «idempotente» no se comprueba corriéndolos contra producción: si uno no
// lo es, lo descubres habiendo borrado datos de un cliente. Así que esto los
// LEE y busca las formas conocidas de no serlo.
//
// NO es un reemplazo de correrlos. Es lo que se puede hacer sin arriesgar nada,
// y caza lo que de verdad aparece.
//
//   node pruebas/seguridad/migraciones-sanas.cjs
// ============================================================================
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'site', 'supabase');

// Cada patrón es una forma real de romper algo al volver a correr un archivo.
// El `salvo` es lo que lo vuelve seguro; si aparece, no se cuenta.
const PELIGROS = [
  { nombre: 'create table sin «if not exists»',
    busca: /create\s+table\s+(?!if\s+not\s+exists)/gi,
    porque: 'la segunda corrida revienta y deja el archivo a medias' },

  { nombre: 'drop table',
    busca: /drop\s+table/gi,
    porque: 'se lleva los datos que hubiera dentro' },

  { nombre: 'drop column',
    busca: /drop\s+column/gi,
    porque: 'se lleva esa columna y lo que guardara' },

  { nombre: 'delete sin where',
    busca: /delete\s+from\s+[a-z_.]+\s*;/gi,
    porque: 'vacía la tabla entera cada vez que se corre' },

  { nombre: 'truncate',
    busca: /truncate/gi,
    porque: 'vacía la tabla, y no avisa' },

  { nombre: 'create index sin «if not exists»',
    busca: /create\s+(unique\s+)?index\s+(?!if\s+not\s+exists|concurrently)/gi,
    porque: 'la segunda corrida falla por nombre repetido' },

  { nombre: 'create type sin guardia',
    busca: /create\s+type\s+/gi,
    salvo: /do\s+\$\$|exception\s+when\s+duplicate_object/i,
    porque: 'no acepta «if not exists»: necesita un bloque que aguante el error' },
];

// Lo que un archivo puede declarar para que se sepa en qué orden va.
const DEPENDE = /requiere[:\s]|requisitos?[:\s]|va\s+despu[eé]s\s+de|depende\s+de/i;

const fallos = [];
const avisos = [];

const archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

console.log('Revisando ' + archivos.length + ' archivos de esquema\n');

let sinDependencia = [];

for (const f of archivos) {
  const sql = fs.readFileSync(path.join(DIR, f), 'utf8');
  // Los comentarios no cuentan: un `-- drop table` explicando algo no borra nada.
  //
  // Y los espacios se aplanan ANTES de buscar. Sin esto, `create index
  // <muchos espacios> if not exists` salía marcado: el `\s+` es codicioso pero
  // retrocede, se queda con un espacio, y entonces el «no vaya seguido de if
  // not exists» se cumple aunque sí lo vaya. Marcó como peligrosos 2 índices
  // que estaban perfectos. Un chequeo que grita lobo se acaba ignorando.
  const codigo = sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/[ \t]+/g, ' ');

  const encontrados = [];
  for (const p of PELIGROS) {
    const hay = codigo.match(p.busca);
    if (!hay) continue;
    if (p.salvo && p.salvo.test(codigo)) continue;
    encontrados.push(p.nombre + ' (' + hay.length + ') — ' + p.porque);
  }

  if (encontrados.length) {
    console.log('  ❌ ' + f);
    for (const e of encontrados) console.log('       ' + e);
    fallos.push(f);
  }

  // `wire-*.local.sql` son de configuración, no de esquema: no llevan orden.
  if (!DEPENDE.test(sql) && !/\.local\.sql$/.test(f)) sinDependencia.push(f);
}

if (!fallos.length) console.log('  ✅ ninguno hace algo que rompa al volver a correrlo');

console.log('');
console.log('── El orden, que es el hueco de verdad ──');
console.log('  ' + (archivos.length - sinDependencia.length) + ' de ' + archivos.length +
            ' dicen de qué dependen.');
if (sinDependencia.length > archivos.length / 2) {
  console.log('');
  console.log('  ⚠️  La mayoría NO lo dice. Mientras la base esté viva no molesta —cada');
  console.log('      archivo se corre solo cuando toca—, pero el día que haya que');
  console.log('      levantarla de cero, el orden no está escrito en ninguna parte.');
  console.log('');
  console.log('      No es para arreglarlo hoy en los 58. Es para que CADA ARCHIVO NUEVO');
  console.log('      diga en su cabecera de qué depende, y el problema deje de crecer.');
  avisos.push('el orden de aplicación no está escrito');
}

console.log('');
if (fallos.length) {
  console.log('═══ ' + fallos.length + ' archivo(s) pueden romper algo al volver a correrse ═══');
  process.exit(1);
}
console.log('═══ Todos se pueden volver a correr ═══' +
            (avisos.length ? '  (con ' + avisos.length + ' aviso)' : ''));
process.exit(0);
