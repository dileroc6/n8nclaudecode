// seed-bejauha-contacts.cjs — Migra los contactos del Google Sheet de Bejauha
// (fuente de verdad MVP) a la tabla public.contacts de Supabase.
//
// Lee el Sheet EN VIVO por su URL de export CSV (no un archivo local). Mapea las
// columnas al modelo contacts, normaliza teléfonos a E.164 (+57), y hace UPSERT
// idempotente por (company_id, phone). Excluye filas de prueba del bot.
//
// uso:
//   node seed-bejauha-contacts.cjs            → DRY RUN (no escribe; muestra qué haría)
//   node seed-bejauha-contacts.cjs --commit   → escribe de verdad en la base
//
// Requiere credentials.env con SUPABASE_DB_URL (o SUPABASE_URL + SERVICE_ROLE_KEY).

const fs = require('fs');
const path = require('path');

// ── env ──
function loadEnv(f) {
  const e = {};
  for (const raw of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const l = raw.trim(); if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('='); if (i < 0) continue;
    let v = l.slice(i + 1).trim();
    if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1);
    e[l.slice(0, i).trim()] = v;
  }
  return e;
}
const env = loadEnv(path.join(__dirname, 'credentials.env'));
const COMMIT = process.argv.includes('--commit');

const SHEET_ID = '1QEkn7Fg9jdh7qnqwWy_FvbWeXr7nrc_S0EcBtSzAFH8';
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const COMPANY_SLUG = 'bejauha';

// ── mapeos de valores del Sheet → enums de contacts ──
const ESTADO = { 'ACTIVO': 'activo', 'NO ACTIVO': 'no_activo', 'PROSPECTO': 'prospecto', 'DEUDOR': 'deudor', 'EMBAJADOR': 'embajador' };
const LEAD = { 'CLIENTE': 'cliente', 'CALIENTE': 'caliente', 'TIBIO': 'tibio', 'FRIO': 'frio', 'FRÍO': 'frio' };
function mapServicio(v) {
  const u = (v || '').toUpperCase().trim();
  if (u.startsWith('PAQUETE')) return 'paquete';
  if (u === 'KARMA') return 'karma';
  if (u === 'BEJA') return 'beja';
  if (u === 'UJA') return 'uja';
  return null;
}
const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

// "26 agosto" → 2026-08-26 (asume año 2026). Devuelve null si no parsea.
function fechaEs(v) {
  if (!v) return null;
  const m = String(v).trim().toLowerCase().match(/(\d{1,2})\s+([a-záéí]+)/);
  if (!m) return null;
  const dia = parseInt(m[1], 10), mes = MESES[m[2]];
  if (!mes) return null;
  return `2026-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Teléfono colombiano → E.164 (+57XXXXXXXXXX). Devuelve null si no es válido.
function normPhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('57') && d.length === 12) return '+' + d;
  if (d.length === 10 && d[0] === '3') return '+57' + d;
  if (d.length >= 12) return '+' + d;   // ya con indicativo
  return '+57' + d;                     // fallback
}

function intOrNull(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s || s === 'na' || s === 'n/a') return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

// ── parser CSV mínimo (maneja comillas y comas internas) ──
function parseCSV(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function isTestRow(r) {
  const nombre = (r.Nombres || '').toUpperCase();
  const obs = (r.Observaciones || '').toLowerCase();
  const fc = (r['Fecha de creacion'] || '').toUpperCase();
  return nombre.startsWith('ZZ') || obs.includes('borrar') || fc === 'PRUEBA' || (r.Telefono || '').includes('3000000001');
}

(async () => {
  // 1) Traer el Sheet en vivo
  const res = await fetch(SHEET_CSV);
  if (!res.ok) { console.error('No pude leer el Sheet:', res.status); process.exit(2); }
  const rows = parseCSV(await res.text());
  const header = rows.shift().map((h) => h.replace(/^﻿/, '').trim());
  const records = rows.filter((r) => r.some((c) => c && c.trim())).map((r) => {
    const o = {}; header.forEach((h, i) => (o[h] = (r[i] || '').trim())); return o;
  });

  // 2) company_id de Bejauha
  const { Client } = require('pg');
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const comp = (await c.query('select id from public.companies where slug=$1', [COMPANY_SLUG])).rows[0];
  if (!comp) { console.error('No existe la empresa', COMPANY_SLUG); process.exit(3); }
  const companyId = comp.id;

  // 3) Mapear
  const warnings = [];
  const staged = [];
  let skippedTest = 0;
  for (const r of records) {
    if (isTestRow(r)) { skippedTest++; continue; }
    const phone = normPhone(r.Telefono);
    const full_name = [r.Nombres, r.Apellidos].map((s) => (s || '').trim()).filter(Boolean).join(' ');
    const service_type = mapServicio(r['Tipo de servicio']);
    const status = ESTADO[(r.Estado || '').toUpperCase()] || 'prospecto';
    const lead_stage = LEAD[(r['Tipo de Lead'] || '').toUpperCase()] || null;
    const clases_restantes = service_type === 'paquete' ? intOrNull(r['Clases restantes']) : null;
    const fecha_renovacion = fechaEs(r['Fecha renovacion']);
    if (!phone) { warnings.push(`Sin teléfono válido: ${full_name} → se omite`); continue; }
    staged.push({
      company_id: companyId, phone, full_name,
      email: (r.Correo || '').trim() || null,
      service_type, status, lead_stage, clases_restantes, fecha_renovacion,
      metadata: {
        origen: 'sheet_bejauha',
        observaciones: r.Observaciones || null,
        seguimiento: r.Seguimiento || null,
        paquete_raw: r['Tipo de servicio'] || null,
        fecha_creacion_sheet: r['Fecha de creacion'] || null,
      },
    });
  }

  // 3b) Excluir teléfonos duplicados POR COMPLETO (se arreglan a mano después).
  const phoneCount = staged.reduce((a, m) => ((a[m.phone] = (a[m.phone] || 0) + 1), a), {});
  const dupPhones = Object.keys(phoneCount).filter((p) => phoneCount[p] > 1);
  dupPhones.forEach((p) => {
    const quienes = staged.filter((m) => m.phone === p).map((m) => m.full_name).join(' / ');
    warnings.push(`Teléfono duplicado ${p} (${quienes}) → OMITIDO por completo (se soluciona a mano)`);
  });
  const mapped = staged.filter((m) => !dupPhones.includes(m.phone));

  // 4) Resumen
  const by = (arr, k) => arr.reduce((a, x) => ((a[x[k]] = (a[x[k]] || 0) + 1), a), {});
  console.log(`\n── Migración Bejauha → contacts  ${COMMIT ? '(COMMIT)' : '(DRY RUN — no escribe)'} ──`);
  console.log(`Filas en el Sheet: ${records.length}  |  de prueba omitidas: ${skippedTest}  |  a migrar (únicos): ${mapped.length}`);
  console.log('Por status:      ', JSON.stringify(by(mapped, 'status')));
  console.log('Por service_type:', JSON.stringify(by(mapped, 'service_type')));
  console.log('Por lead_stage:  ', JSON.stringify(by(mapped, 'lead_stage')));
  console.log(`Con saldo de clases (paquete): ${mapped.filter((m) => m.clases_restantes != null).length}`);
  console.log(`Con email: ${mapped.filter((m) => m.email).length}  |  con fecha_renovacion: ${mapped.filter((m) => m.fecha_renovacion).length}`);
  if (warnings.length) { console.log('\n⚠️  Avisos:'); warnings.forEach((w) => console.log('   - ' + w)); }
  console.log('\nMuestra (primeros 5):');
  mapped.slice(0, 5).forEach((m) => console.log('   ', m.phone, '|', m.full_name, '|', m.service_type, '|', m.status, '|', m.lead_stage, '| clases:', m.clases_restantes, '| renov:', m.fecha_renovacion));

  // 5) Escribir (solo con --commit)
  if (!COMMIT) {
    console.log('\n(DRY RUN) Nada se escribió. Corré con --commit para migrar de verdad.');
    await c.end(); return;
  }
  let ins = 0;
  for (const m of mapped) {
    await c.query(
      `insert into public.contacts (company_id, phone, full_name, email, service_type, status, lead_stage, clases_restantes, fecha_renovacion, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (company_id, phone) do update set
         full_name=excluded.full_name, email=excluded.email, service_type=excluded.service_type,
         status=excluded.status, lead_stage=excluded.lead_stage, clases_restantes=excluded.clases_restantes,
         fecha_renovacion=excluded.fecha_renovacion, metadata=excluded.metadata`,
      [m.company_id, m.phone, m.full_name, m.email, m.service_type, m.status, m.lead_stage, m.clases_restantes, m.fecha_renovacion, m.metadata]
    );
    ins++;
  }
  const total = (await c.query('select count(*)::int n from public.contacts where company_id=$1', [companyId])).rows[0].n;
  console.log(`\n✅ Migrados/actualizados: ${ins}. Total contacts de Bejauha en la base: ${total}.`);
  await c.end();
})().catch((e) => { console.error('FALLÓ:', e.message); process.exit(1); });
