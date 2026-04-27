#!/usr/bin/env node
'use strict';

/**
 * migrate.js — Aplica migraciones SQL pendientes
 *
 * Uso:
 *   node scripts/migrate.js                     → solo schema public
 *   node scripts/migrate.js cli_00001           → schema cliente específico
 *   node scripts/migrate.js --all-clients       → todos los clientes activos
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

async function getMigrationsDir() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

async function getAppliedMigrations(client, schema) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.db_migrations (
      id              SERIAL PRIMARY KEY,
      nombre          VARCHAR(255) NOT NULL UNIQUE,
      aplicada_en     TIMESTAMPTZ DEFAULT NOW(),
      schema_objetivo VARCHAR(50) DEFAULT 'public'
    )
  `);
  const res = await client.query(
    'SELECT nombre FROM public.db_migrations WHERE schema_objetivo = $1',
    [schema]
  );
  return new Set(res.rows.map(r => r.nombre));
}

async function applyMigration(client, file, schema) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  let sql = fs.readFileSync(filePath, 'utf8');
  sql = sql.replace(/\{schema\}/g, schema);

  await client.query('BEGIN');
  try {
    await client.query(sql);
    const migrationName = file.replace('.sql', '');
    await client.query(
      'INSERT INTO public.db_migrations (nombre, schema_objetivo) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
      [migrationName, schema]
    );
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function migrateSchema(schema) {
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
  });

  await client.connect();
  console.log(`\n📦 Migrando schema: ${schema}`);

  try {
    const allFiles = await getMigrationsDir();
    const applied = await getAppliedMigrations(client, schema);

    const pending = allFiles.filter(f => !applied.has(f.replace('.sql', '')));

    if (pending.length === 0) {
      console.log('  ✅ Sin migraciones pendientes');
      return;
    }

    for (const file of pending) {
      process.stdout.write(`  ⏳ ${file} ... `);
      try {
        await applyMigration(client, file, schema);
        console.log('✅');
      } catch (err) {
        console.log('❌');
        console.error(`     Error: ${err.message}`);
        throw err;
      }
    }

    console.log(`  ✅ ${pending.length} migración(es) aplicada(s)`);
  } finally {
    await client.end();
  }
}

async function getAllActiveClients() {
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
  });
  await client.connect();
  try {
    const res = await client.query('SELECT cliente_id FROM public.clientes WHERE activo = true');
    return res.rows.map(r => r.cliente_id);
  } finally {
    await client.end();
  }
}

async function main() {
  const arg = process.argv[2];

  if (!arg || arg === '--public') {
    await migrateSchema('public');
  } else if (arg === '--all-clients') {
    await migrateSchema('public');
    const clients = await getAllActiveClients();
    for (const clientId of clients) {
      await migrateSchema(clientId);
    }
  } else {
    await migrateSchema(arg);
  }

  console.log('\n✅ Migración completada\n');
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
