#!/usr/bin/env node
/* ============================================================================
 * TASK.md — el conjunto de trabajo, sacado del tablero
 * ----------------------------------------------------------------------------
 *   node ToqueFlow/render-task.cjs
 *
 * POR QUE ESTO SE GENERA Y NO SE ESCRIBE A MANO
 *
 * `TABLERO.md` ya es la lista de tareas: 60 abiertas, con su historia y su
 * dueño. Un `TASK.md` escrito a mano seria una SEGUNDA lista de lo mismo, y dos
 * listas de lo mismo se separan solas.
 *
 * No es teoria en este repo. La fila 161 estuvo tres dias marcada como abierta
 * estando hecha. La 169 se escribio en un sitio que nunca se guardo, y la 16
 * quedo apuntando a una fila que no existia. Las 62 y 159 describian la misma
 * tarea dos veces.
 *
 * Asi que TASK.md no es una lista nueva: es una VISTA del tablero, pensada para
 * abrir una sesion sin leerse 138 KB. El tablero manda; esto se regenera.
 *
 * Que trae, y por que ese recorte:
 *   · lo urgente (🚨 y 🔴), que es lo que decide si algo mas puede esperar
 *   · lo que puede hacer Claude solo, que es por donde arranca una sesion
 *   · lo que espera a una persona, para no volver a proponerlo cada vez
 *   · el resto, solo contado
 * ========================================================================== */
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const TABLERO = path.join(AQUI, 'TABLERO.md');
const SALIDA = path.join(AQUI, '..', 'TASK.md');

const t = fs.readFileSync(TABLERO, 'utf8');

let seccion = '';
const abiertas = [];
for (const l of t.split('\n')) {
  const s = l.match(/^## (.+)/);
  if (s) { seccion = s[1].trim(); continue; }
  const m = l.match(/^\| (\d+) \| (.+?) \|/);
  if (!m) continue;

  const [, num, tarea] = m;
  const cols = l.split('|').filter((x) => x.trim() !== '');
  const ultima = (cols[cols.length - 1] || '').trim();

  // Tachada o con ✅ en la última columna = cerrada.
  if (/~~/.test(tarea) || /^✅/.test(ultima)) continue;

  const limpio = tarea.replace(/\*\*/g, '').replace(/\s*\*\(.*?\)\*/g, '').trim();
  const quien = ultima.length > 30 ? '—' : ultima;
  const urgente = /^🚨/.test(limpio) || /^🔴/.test(limpio);

  // La nota es la segunda columna: la primera frase basta para saber de qué va.
  const nota = (cols[2] || '').trim().replace(/\*\*/g, '').replace(/<br>/g, ' ');
  const resumen = nota.split(/(?<=\.)\s/)[0].slice(0, 190);

  abiertas.push({ num: +num, seccion, tarea: limpio, quien, urgente, resumen });
}

const esMia = (a) => /claude/i.test(a.quien);
const esDecision = (a) => /decisi/i.test(a.quien) || /ambos/i.test(a.quien) || a.quien === '—';

const urgentes = abiertas.filter((a) => a.urgente).sort((a, b) => a.num - b.num);
const mias = abiertas.filter((a) => !a.urgente && esMia(a)).sort((a, b) => a.num - b.num);
const personas = abiertas.filter((a) => !a.urgente && !esMia(a) && !esDecision(a)).sort((a, b) => a.num - b.num);
const decisiones = abiertas.filter((a) => !a.urgente && !esMia(a) && esDecision(a)).sort((a, b) => a.num - b.num);

const fila = (a) => '| **' + a.num + '** | ' + a.tarea + ' | ' + a.quien + ' |';
const filaConNota = (a) => '| **' + a.num + '** | ' + a.tarea + '<br><sub>' + a.resumen + '</sub> | ' + a.quien + ' |';

const hoy = new Date().toISOString().slice(0, 10);

const out = [
  '# Tareas — el conjunto de trabajo',
  '',
  '> **Generado.** No se edita a mano: sale de [`ToqueFlow/TABLERO.md`](ToqueFlow/TABLERO.md),',
  '> que es la única lista de verdad. Para regenerarlo:',
  '>',
  '> ```',
  '> node ToqueFlow/render-task.cjs',
  '> ```',
  '>',
  '> Existe para abrir una sesión sin leerse el tablero entero. Si algo de aquí',
  '> contradice al tablero, **manda el tablero** y hay que regenerar.',
  '',
  'Al ' + hoy + ': **' + abiertas.length + ' tareas abiertas.**',
  '',
  '---',
  '',
  '## 🚨 Urgente — decide si lo demás puede esperar',
  '',
  urgentes.length ? '| # | Qué | Quién |\n|---|---|---|\n' + urgentes.map(filaConNota).join('\n')
                  : '_Nada urgente ahora mismo._',
  '',
  '## 🤖 Lo que puede hacer Claude solo',
  '',
  'Por aquí arranca una sesión cuando no hay nada urgente.',
  '',
  mias.length ? '| # | Qué | |\n|---|---|---|\n' + mias.map(filaConNota).join('\n')
              : '_Nada pendiente del lado de Claude._',
  '',
  '## 👤 Esperando a una persona',
  '',
  'No proponer estas como trabajo: no avanzan sin que alguien haga algo fuera del repo.',
  '',
  personas.length ? '| # | Qué | Quién |\n|---|---|---|\n' + personas.map(fila).join('\n')
                  : '_Nada esperando._',
  '',
  '## 🤔 Decisiones abiertas',
  '',
  decisiones.length ? '| # | Qué |\n|---|---|\n' + decisiones.map((a) => '| **' + a.num + '** | ' + a.tarea + ' |').join('\n')
                    : '_Ninguna._',
  '',
  '---',
  '',
  '_El detalle de cada fila —por qué existe, qué se probó, qué se decidió— está en_',
  '_[`ToqueFlow/TABLERO.md`](ToqueFlow/TABLERO.md). Aquí solo está el titular._',
  '',
].join('\n');

fs.writeFileSync(SALIDA, out);
console.log('TASK.md generado — ' + abiertas.length + ' abiertas · ' +
  urgentes.length + ' urgentes · ' + mias.length + ' de Claude · ' +
  personas.length + ' de personas · ' + decisiones.length + ' decisiones');
