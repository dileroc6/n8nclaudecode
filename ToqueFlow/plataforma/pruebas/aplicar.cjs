// ============================================================================
// Aplicar un archivo de esquema a Supabase
// ----------------------------------------------------------------------------
//   node pruebas/aplicar.cjs schema-<tema>.sql
//
// Corre el archivo entero en UNA transacción implícita de Postgres. Si algo
// falla, dice el mensaje y el trozo de SQL donde pasó — que es lo que hace
// falta para arreglarlo, y lo que uno no tiene cuando pega el SQL en un panel
// web y solo ve «syntax error».
//
// Todo esquema de este proyecto es idempotente, así que volver a correr un
// archivo es seguro. Si no lo fuera, lo caza:
//   node pruebas/seguridad/migraciones-sanas.cjs
// ============================================================================
const fs = require('fs');
const path = require('path');

const PLAT = path.join(__dirname, '..');
const env = {};
for (const l of fs.readFileSync(path.join(PLAT, 'credentials.env'), 'utf8').split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); if (i < 0) continue;
  let v = t.slice(i + 1).trim();
  if (/^["'].*["']$/.test(v)) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
const { Client } = require(path.join(PLAT, 'node_modules', 'pg'));

const archivo = process.argv[2];
if (!archivo) {
  console.error('Falta el archivo.  node pruebas/aplicar.cjs schema-<tema>.sql');
  process.exit(2);
}

const ruta = path.isAbsolute(archivo) ? archivo
  : fs.existsSync(archivo) ? archivo
  : path.join(PLAT, 'site', 'supabase', archivo);

if (!fs.existsSync(ruta)) {
  console.error('No encuentro ' + ruta);
  process.exit(2);
}

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const sql = fs.readFileSync(ruta, 'utf8');

  // Los `raise notice` de los bloques `do $$` son la forma en que un esquema
  // cuenta lo que hizo. Sin esto no se ven, y uno se queda sin saber si el
  // parche se aplicó o se salto porque ya estaba.
  c.on('notice', (n) => console.log('   · ' + String(n.message)));

  try {
    await c.query(sql);
    console.log('aplicado: ' + path.basename(ruta));
  } catch (e) {
    console.log('FALLÓ: ' + e.message);
    if (e.position) {
      const p = Number(e.position);
      console.log('');
      console.log('   cerca de:');
      console.log('   …' + sql.slice(Math.max(0, p - 160), p + 160).replace(/\n/g, '\n   ') + '…');
    }
    if (e.hint) console.log('   pista: ' + e.hint);
    process.exitCode = 1;
  }

  await c.end();
  process.exit(process.exitCode || 0);
})();
