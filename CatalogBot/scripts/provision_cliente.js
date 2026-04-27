#!/usr/bin/env node
'use strict';

/**
 * provision_cliente.js — Crea schema + tablas + admin inicial en PostgreSQL
 *
 * Uso:
 *   node scripts/provision_cliente.js \
 *     <cliente_id> <nombre> <ecommerce_tipo> <ecommerce_url> \
 *     <whatsapp_instance> <telefono_admin> <nombre_admin>
 *
 * Ejemplo:
 *   node scripts/provision_cliente.js \
 *     cli_00001 "Mi Tienda" woocommerce https://mitienda.com \
 *     instancia_wa_001 573001234567 "Juan Pérez"
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 7) {
    console.error('❌ Uso: node provision_cliente.js <cliente_id> <nombre> <ecommerce_tipo> <ecommerce_url> <whatsapp_instance> <telefono_admin> <nombre_admin>');
    process.exit(1);
  }
  return {
    clienteId: args[0],
    nombre: args[1],
    ecommerceTipo: args[2],
    ecommerceUrl: args[3],
    whatsappInstance: args[4],
    telefonoAdmin: args[5],
    nombreAdmin: args[6]
  };
}

function validateClienteId(id) {
  if (!/^cli_[a-zA-Z0-9_]+$/.test(id)) {
    throw new Error(`cliente_id inválido: "${id}". Debe empezar con cli_ y contener solo letras, números y guiones bajos`);
  }
  if (id.length > 20) {
    throw new Error(`cliente_id demasiado largo: máximo 20 caracteres`);
  }
}

function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

async function step(label, fn) {
  process.stdout.write(`  ⏳ ${label} ... `);
  try {
    const result = await fn();
    console.log('✅');
    return result;
  } catch (err) {
    console.log('❌');
    throw err;
  }
}

async function main() {
  const params = parseArgs();
  validateClienteId(params.clienteId);

  console.log(`\n🚀 Provisionando cliente: ${params.clienteId} — ${params.nombre}\n`);

  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
  });

  await client.connect();

  try {
    const webhookSecret = generateWebhookSecret();

    // Paso 1: INSERT en public.clientes
    await step('Registrar cliente en public.clientes', async () => {
      await client.query(`
        INSERT INTO public.clientes (
          cliente_id, nombre, activo, ecommerce_tipo, ecommerce_url,
          n8n_credential_name, cloudinary_folder, whatsapp_instance, webhook_secret
        ) VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8)
      `, [
        params.clienteId,
        params.nombre,
        params.ecommerceTipo,
        params.ecommerceUrl,
        `${params.clienteId}_${params.ecommerceTipo}`,
        params.clienteId,
        params.whatsappInstance,
        webhookSecret
      ]);
    });

    // Paso 2: CREATE SCHEMA
    await step(`Crear schema ${params.clienteId}`, async () => {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${params.clienteId}"`);
    });

    // Paso 3: Ejecutar migraciones de cliente
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql') && !f.startsWith('20240417_000'))
      .sort();

    for (const file of migrationFiles) {
      await step(`Migración: ${file}`, async () => {
        let sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        sql = sql.replace(/\{schema\}/g, params.clienteId);
        await client.query(sql);

        const migrationName = file.replace('.sql', '');
        await client.query(
          'INSERT INTO public.db_migrations (nombre, schema_objetivo) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
          [migrationName, params.clienteId]
        );
      });
    }

    // Paso 4: INSERT usuario admin inicial
    await step('Crear usuario admin inicial', async () => {
      await client.query(`
        INSERT INTO "${params.clienteId}".usuarios (telefono, nombre, rol, activo)
        VALUES ($1, $2, 'admin', true)
        ON CONFLICT (telefono) DO NOTHING
      `, [params.telefonoAdmin, params.nombreAdmin]);
    });

    // Paso 5: Crear sesión inicial para el admin
    await step('Inicializar sesión del admin', async () => {
      await client.query(`
        INSERT INTO "${params.clienteId}".sesiones (telefono, estado)
        VALUES ($1, 'idle')
        ON CONFLICT (telefono) DO NOTHING
      `, [params.telefonoAdmin]);
    });

    // Resumen
    console.log('\n' + '─'.repeat(60));
    console.log('✅ CLIENTE PROVISIONADO EXITOSAMENTE');
    console.log('─'.repeat(60));
    console.log(`  cliente_id:          ${params.clienteId}`);
    console.log(`  nombre:              ${params.nombre}`);
    console.log(`  ecommerce_tipo:      ${params.ecommerceTipo}`);
    console.log(`  ecommerce_url:       ${params.ecommerceUrl}`);
    console.log(`  whatsapp_instance:   ${params.whatsappInstance}`);
    console.log(`  n8n_credential_name: ${params.clienteId}_${params.ecommerceTipo}`);
    console.log(`  cloudinary_folder:   /${params.clienteId}/`);
    console.log(`  admin_telefono:      ${params.telefonoAdmin}`);
    console.log(`  admin_nombre:        ${params.nombreAdmin}`);
    console.log(`  webhook_secret:      ${webhookSecret}`);
    console.log('─'.repeat(60));
    console.log('\n⚠️  GUARDAR el webhook_secret — no se puede recuperar después');
    console.log('\nPasos manuales pendientes:');
    console.log('  1. Crear instancia en Evolution API con nombre:', params.whatsappInstance);
    console.log('  2. Configurar webhook en Evolution con el secret mostrado arriba');
    console.log(`  3. Crear Credential en n8n: "${params.clienteId}_${params.ecommerceTipo}"`);
    console.log(`  4. Crear carpeta /${params.clienteId}/ en Cloudinary`);
    console.log('  5. Ejecutar prueba de humo desde WhatsApp\n');

  } catch (err) {
    console.error('\n❌ Error durante el provisionamiento:', err.message);
    console.error('   El proceso se detuvo. Verificar el estado de la BD antes de reintentar.');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
