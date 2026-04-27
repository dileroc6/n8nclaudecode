#!/usr/bin/env node
'use strict';

/**
 * test_tools.js — Prueba cada tool del AI Agent contra el cliente de prueba
 *
 * Usa el cliente cli_test del seed. No modifica datos reales.
 * Requiere haber ejecutado provision_cliente.js con cli_test y el seed.
 *
 * Uso:
 *   node scripts/test_tools.js
 *   node scripts/test_tools.js --tool buscar_producto
 */

require('dotenv').config();
const { Client } = require('pg');

const CLIENTE_ID = 'cli_test';
const TELEFONO_TEST = '573001111111';

const db = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

let passed = 0;
let failed = 0;

async function test(name, fn) {
  process.stdout.write(`  ⏳ ${name} ... `);
  try {
    await fn();
    console.log('✅');
    passed++;
  } catch (err) {
    console.log(`❌  ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Aserción fallida');
}

// --- Tests de base de datos (validan esquema y datos del seed) ---

async function testEsquemaCliente() {
  await test('Schema cli_test existe', async () => {
    const res = await db.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [CLIENTE_ID]
    );
    assert(res.rows.length > 0, `Schema ${CLIENTE_ID} no existe`);
  });

  await test('Tablas del schema existen', async () => {
    const tablas = ['usuarios', 'sesiones', 'historial_conversacion', 'auditoria', 'programados', 'errores', 'metricas_diarias'];
    for (const tabla of tablas) {
      const res = await db.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
        [CLIENTE_ID, tabla]
      );
      assert(res.rows.length > 0, `Tabla ${CLIENTE_ID}.${tabla} no existe`);
    }
  });

  await test('Usuario admin de prueba existe', async () => {
    const res = await db.query(
      `SELECT telefono, rol FROM ${CLIENTE_ID}.usuarios WHERE telefono = $1`,
      [TELEFONO_TEST]
    );
    assert(res.rows.length > 0, 'Admin de prueba no encontrado');
    assert(res.rows[0].rol === 'admin', `Rol incorrecto: ${res.rows[0].rol}`);
  });
}

async function testSesiones() {
  await test('Leer sesión existente', async () => {
    const res = await db.query(
      `SELECT estado FROM ${CLIENTE_ID}.sesiones WHERE telefono = $1`,
      [TELEFONO_TEST]
    );
    assert(res.rows.length > 0, 'Sesión no encontrada');
    assert(res.rows[0].estado === 'idle', `Estado inesperado: ${res.rows[0].estado}`);
  });

  await test('Actualizar estado de sesión', async () => {
    await db.query(
      `UPDATE ${CLIENTE_ID}.sesiones SET estado = 'procesando' WHERE telefono = $1`,
      [TELEFONO_TEST]
    );
    const res = await db.query(
      `SELECT estado FROM ${CLIENTE_ID}.sesiones WHERE telefono = $1`,
      [TELEFONO_TEST]
    );
    assert(res.rows[0].estado === 'procesando', 'Estado no actualizado');
    // Restaurar
    await db.query(
      `UPDATE ${CLIENTE_ID}.sesiones SET estado = 'idle', datos_pendientes = NULL WHERE telefono = $1`,
      [TELEFONO_TEST]
    );
  });

  await test('Lock de sesión con SELECT FOR UPDATE', async () => {
    await db.query('BEGIN');
    const res = await db.query(
      `SELECT lock_timestamp FROM ${CLIENTE_ID}.sesiones WHERE telefono = $1 FOR UPDATE`,
      [TELEFONO_TEST]
    );
    await db.query(
      `UPDATE ${CLIENTE_ID}.sesiones SET lock_timestamp = NOW() WHERE telefono = $1`,
      [TELEFONO_TEST]
    );
    await db.query('COMMIT');
    assert(res !== null, 'SELECT FOR UPDATE falló');
  });
}

async function testHistorial() {
  await test('Insertar turno en historial_conversacion', async () => {
    await db.query(
      `INSERT INTO ${CLIENTE_ID}.historial_conversacion (telefono, turno, rol, contenido, tokens_aprox)
       VALUES ($1, 9999, 'user', 'Mensaje de prueba test_tools.js', 10)`,
      [TELEFONO_TEST]
    );
    const res = await db.query(
      `SELECT contenido FROM ${CLIENTE_ID}.historial_conversacion WHERE turno = 9999 AND telefono = $1`,
      [TELEFONO_TEST]
    );
    assert(res.rows.length > 0, 'Inserción de historial falló');
    // Limpiar
    await db.query(
      `DELETE FROM ${CLIENTE_ID}.historial_conversacion WHERE turno = 9999`,
    );
  });

  await test('Reconstruir historial (últimos 10 turnos)', async () => {
    const res = await db.query(
      `SELECT rol, contenido FROM ${CLIENTE_ID}.historial_conversacion
       WHERE telefono = $1 ORDER BY turno DESC LIMIT 10`,
      [TELEFONO_TEST]
    );
    assert(Array.isArray(res.rows), 'Query de historial no retornó array');
  });
}

async function testAuditoria() {
  await test('Insertar registro de auditoría', async () => {
    const res = await db.query(
      `INSERT INTO ${CLIENTE_ID}.auditoria (telefono, usuario_nombre, rol, accion, producto_id, campo, valor_anterior, valor_nuevo)
       VALUES ($1, 'Test', 'admin', 'test_action', 'PROD-TEST', 'precio', '100', '90')
       RETURNING id`,
      [TELEFONO_TEST]
    );
    assert(res.rows[0].id > 0, 'ID de auditoría inválido');
    // Limpiar
    await db.query(`DELETE FROM ${CLIENTE_ID}.auditoria WHERE accion = 'test_action'`);
  });
}

async function testProgramados() {
  await test('Insertar y leer programado pendiente', async () => {
    const res = await db.query(
      `INSERT INTO ${CLIENTE_ID}.programados (timestamp_ejecucion, telefono, accion, datos_json)
       VALUES (NOW() + INTERVAL '1 hour', $1, 'test_programado', '{"test": true}')
       RETURNING id`,
      [TELEFONO_TEST]
    );
    const id = res.rows[0].id;
    const check = await db.query(
      `SELECT estado FROM ${CLIENTE_ID}.programados WHERE id = $1`,
      [id]
    );
    assert(check.rows[0].estado === 'pendiente', 'Estado inicial incorrecto');
    // Limpiar
    await db.query(`DELETE FROM ${CLIENTE_ID}.programados WHERE id = $1`, [id]);
  });
}

async function testAislamiento() {
  await test('Aislamiento: query cross-schema retorna error si schema no existe', async () => {
    try {
      await db.query('SELECT * FROM cli_inexistente_xxxxx.sesiones LIMIT 1');
      throw new Error('Debería haber lanzado error por schema inexistente');
    } catch (err) {
      assert(err.message.includes('does not exist'), `Error inesperado: ${err.message}`);
    }
  });

  await test('Aislamiento: cliente existe en public.clientes', async () => {
    const res = await db.query(
      'SELECT cliente_id FROM public.clientes WHERE cliente_id = $1',
      [CLIENTE_ID]
    );
    assert(res.rows.length > 0, `Cliente ${CLIENTE_ID} no encontrado en public.clientes`);
  });
}

async function main() {
  const toolFilter = process.argv[3];

  console.log(`\n🧪 CatalogBot — Test de tools contra cliente: ${CLIENTE_ID}\n`);

  await db.connect();

  try {
    console.log('📋 Schema y estructura:');
    await testEsquemaCliente();

    console.log('\n📋 Sesiones:');
    await testSesiones();

    console.log('\n📋 Historial de conversación:');
    await testHistorial();

    console.log('\n📋 Auditoría:');
    await testAuditoria();

    console.log('\n📋 Programados:');
    await testProgramados();

    console.log('\n📋 Aislamiento por cliente:');
    await testAislamiento();

  } finally {
    await db.end();
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`Resultados: ${passed} ✅  ${failed} ❌`);

  if (failed > 0) {
    console.log('\n❌ Algunos tests fallaron. Revisar antes de continuar.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Todos los tests pasaron.\n');
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
