/**
 * VASSCO — Ingesta automática de facturas de compra
 * ---------------------------------------------------------------------------
 * Qué hace, cada 5 minutos y solo:
 *   1. Busca en Gmail correos con ZIP adjunto (factura electrónica).
 *   2. Descomprime el ZIP  → saca el XML (datos) y el PDF (soporte).
 *   3. Lee la factura del XML (AttachedDocument DIAN con <Invoice> en CDATA).
 *   4. Si el EMISOR es Vassco → es una VENTA → la ignora.
 *   5. Renombra el PDF  «<día> <MES> <N°factura> <PROVEEDOR>.pdf»  y lo sube a
 *      Drive:  CONTABILIDAD VASSCO / 2026 / <mes> / EMITIDAS <mes> 2026 /
 *   6. Escribe la fila en la pestaña del mes del Google Sheet (link del PDF en F).
 *      Las RETENCIONES (RF/ICA) se dejan en blanco → las llena el motor 2026 / revisión humana.
 *
 * NO usa API keys ni contraseñas: corre DENTRO de la cuenta de Gmail.
 * Instalar una copia en cada cuenta: vasscogeneral@gmail.com y contabilidadvassco@gmail.com.
 *
 * INSTALACIÓN (una vez por cuenta):
 *   1) script.google.com (logueado en esa cuenta) → pegar este archivo.
 *   2) Ejecutar `instalarTrigger` → aceptar la pantalla "Permitir".
 *   3) Listo: corre solo cada 5 min. Para probar a mano, ejecutar `runIngesta`.
 */

const CONFIG = {
  SHEET_ID:        '1xsWrPTbNXSWwjjyVljechuY4tiVdomEgfjukMUHkg3E',
  DRIVE_ROOT_ID:   '',                     // (recomendado) ID de la carpeta "CONTABILIDAD VASSCO"
  DRIVE_ROOT_NAME: 'CONTABILIDAD VASSCO',  // fallback: se busca por nombre si no hay ID
  ANIO:            2026,
  VASSCO_NIT:      '901962018',            // si el emisor es este NIT → VENTA → se ignora
  GMAIL_QUERY:     'has:attachment filename:zip newer_than:3d -label:vassco-procesada',
  LABEL_OK:        'vassco-procesada',
  LABEL_VENTA:     'vassco-venta',
  LABEL_ERROR:     'vassco-error',
  // Cerebro tributario (edge function). La ANON key es pública (la misma del sitio):
  // Supabase → Project Settings → API → "anon public". Pégala aquí.
  RETENCION_URL:     'https://pyoauvbwqxuuzamnjwfd.supabase.co/functions/v1/vassco-retencion',
  SUPABASE_ANON_KEY: 'PEGA_AQUI_LA_ANON_KEY_PUBLICA',
};

const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
               'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

// Concepto habitual por NIT (semilla del historial; ampliable). Vacío → se clasifica luego.
const CONCEPTO_POR_NIT = {
  '901089618':  'POLLO',   // Grupo Empresarial Ricam
  '1032386567': 'CARNE',   // Super Cárnicos San Luis
  '80813595':   'FRUVER',  // Andrés Salcedo
};

/** Punto de entrada: lo dispara el trigger cada 5 min. */
function runIngesta() {
  const labelOk = getOrCreateLabel_(CONFIG.LABEL_OK);
  const threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, 50);
  let ok = 0, ventas = 0, skip = 0, err = 0;

  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      try {
        const r = processMessage_(msg);
        if (r === 'venta') { ventas++; addLabel_(thread, CONFIG.LABEL_VENTA); }
        else if (r === 'ok') { ok++; }
        else { skip++; }
      } catch (e) {
        err++; addLabel_(thread, CONFIG.LABEL_ERROR);
        Logger.log('ERROR [' + msg.getSubject() + '] :: ' + e);
      }
    });
    thread.addLabel(labelOk); // marca el hilo para no reprocesarlo
  });
  Logger.log('Ingesta → ' + ok + ' procesadas · ' + ventas + ' ventas · ' + skip + ' saltadas · ' + err + ' errores');
}

function processMessage_(msg) {
  const zips = msg.getAttachments().filter(function (a) { return /\.zip$/i.test(a.getName()); });
  if (!zips.length) return 'skip';

  let result = 'skip';
  zips.forEach(function (zip) {
    const files  = Utilities.unzip(zip.copyBlob().setContentType('application/zip'));
    const xml    = files.filter(function (f) { return /\.xml$/i.test(f.getName()); })[0];
    const pdf    = files.filter(function (f) { return /\.pdf$/i.test(f.getName()); })[0];
    if (!xml) return;

    const inv = parseInvoiceXml_(xml.getDataAsString('UTF-8'));

    if (inv.nit === CONFIG.VASSCO_NIT) { result = 'venta'; return; }   // es una venta
    if (yaProcesada_(inv.cufe))        { result = 'skip';  return; }   // dedup por CUFE

    const fname = inv.dia + ' ' + inv.mes + ' ' + inv.numf + ' ' + inv.nombre + '.pdf';
    let url = '';
    if (pdf) {
      const folder = getEmitidasFolder_(inv.mes);
      const file = folder.createFile(pdf.copyBlob().setName(fname));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      url = file.getUrl();
    }
    const sug = sugerirRetenciones_(inv);
    escribirFila_(inv, fname, url, sug);
    marcarProcesada_(inv.cufe);
    result = 'ok';
  });
  return result;
}

/** Lee la factura DIAN: AttachedDocument con el <Invoice> UBL embebido en CDATA. */
function parseInvoiceXml_(xmlString) {
  let invString = xmlString;
  const m = xmlString.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (m && (m[1].indexOf('Invoice') > -1 || m[1].indexOf('CreditNote') > -1)) invString = m[1];
  invString = invString.replace(/^﻿/, '').trim();

  const root = XmlService.parse(invString).getRootElement();

  const issue = textByName_(root, 'IssueDate');           // 2026-07-06
  const p = issue.split('-');
  const dia = parseInt(p[2], 10);
  const mes = MESES[parseInt(p[1], 10) - 1];

  const sup = firstByName_(root, 'AccountingSupplierParty');
  const companyId = firstByName_(sup, 'CompanyID');
  const nit = companyId ? companyId.getText() : '';
  const dvAttr = companyId ? companyId.getAttribute('schemeID') : null; // DV va en @schemeID
  const dv = dvAttr ? dvAttr.getValue() : '';
  const nombre = textByName_(sup, 'RegistrationName');

  // Impuestos: sumar IVA/IPO; la base no gravada se calcula por residuo → la col O siempre cuadra.
  let iva19 = 0, iva5 = 0, ipo = 0, baseGrav = 0;
  allByName_(root, 'TaxSubtotal', []).forEach(function (sub) {
    const scheme = firstByName_(sub, 'TaxScheme');
    const schId  = scheme ? textByName_(scheme, 'ID') : '';
    const name   = scheme ? textByName_(scheme, 'Name') : '';
    const pct = money_(textByName_(sub, 'Percent'));
    const tax = money_(textByName_(sub, 'TaxAmount'));
    const tb  = money_(textByName_(sub, 'TaxableAmount'));
    if ((schId === '01' || /IVA/i.test(name)) && pct > 0) {
      baseGrav += tb;
      if (Math.abs(pct - 19) < 0.5) iva19 += tax;
      else if (Math.abs(pct - 5) < 0.5) iva5 += tax;
    } else if (/CONSUMO/i.test(name) || schId === '02' || schId === '04') {
      ipo += tax;
    }
  });
  const total = money_(textByName_(firstByName_(root, 'LegalMonetaryTotal'), 'PayableAmount'));
  const items = allByName_(root, 'InvoiceLine', []).map(function (ln) { return textByName_(ln, 'Description'); }).filter(String);

  return {
    nit: nit, dv: dv, nombre: nombre,
    numf: (firstByName_(root, 'ID') || {}).getText ? firstByName_(root, 'ID').getText() : '',
    cufe: textByName_(root, 'UUID'),
    dia: dia, mes: mes, fechaISO: issue, items: items,
    baseGrav: Math.round(baseGrav),
    baseNoGrav: Math.round(total - baseGrav - iva19 - iva5 - ipo),
    iva19: iva19, iva5: iva5, ipo: ipo, total: total,
    concepto: CONCEPTO_POR_NIT[nit] || ''
  };
}

// Llama al cerebro tributario (edge function) → { concepto, rf, ica, vr_pagar, revisar }.
// Si falla (red, sin key), devuelve un fallback seguro: sin retenciones y marcado a revisar,
// para que la ingesta nunca se rompa por culpa del cerebro.
function sugerirRetenciones_(inv) {
  try {
    const res = UrlFetchApp.fetch(CONFIG.RETENCION_URL, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY, apikey: CONFIG.SUPABASE_ANON_KEY },
      payload: JSON.stringify({
        emisor_nit: inv.nit, emisor_nombre: inv.nombre, fecha: inv.fechaISO,
        total: inv.total, base_gravada: inv.baseGrav, base_no_gravada: inv.baseNoGrav,
        items: inv.items || [], concepto_conocido: inv.concepto || ''
      })
    });
    if (res.getResponseCode() === 200) return JSON.parse(res.getContentText());
    Logger.log('sugerirRetenciones_ HTTP ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 200));
  } catch (e) { Logger.log('sugerirRetenciones_ falló: ' + e); }
  return { concepto: inv.concepto || '', rf: { valor: 0 }, ica: { valor: 0 }, vr_pagar: inv.total, revisar: true };
}

/** Escribe la fila (columnas A..U) debajo de la última con datos, con la retención sugerida. */
function escribirFila_(inv, fname, url, sug) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = getMonthSheet_(ss, inv.mes);
  const row = findLastDataRow_(sh) + 1;
  const link = url ? '=HYPERLINK("' + url + '","' + fname.replace(/"/g, '') + '")' : fname;

  const concepto = (sug && sug.concepto) || inv.concepto || '';
  const rf  = (sug && sug.rf  && Number(sug.rf.valor))  || 0;
  const ica = (sug && sug.ica && Number(sug.ica.valor)) || 0;
  const vrPagar = (sug && sug.vr_pagar) || (inv.total - rf - ica);
  const flag = (rf > 0 || ica > 0 || !concepto) ? 'REVISAR' : ''; // solo marca lo que amerita ojo humano

  sh.getRange(row, 1, 1, 21).setValues([[
    inv.dia,               // A  FECHA (día)
    true,                  // B  (check)
    inv.nit,               // C  NIT
    inv.dv,                // D  DV
    inv.nombre,            // E  NOMBRE
    link,                  // F  archivo (link Drive)
    inv.numf,              // G  FACTURA
    concepto,              // H  CONCEPTO
    inv.baseGrav   || '',  // I  BASE
    inv.baseNoGrav || '',  // J  BASE NO GRAVADA
    inv.iva19 || '',       // K  IVA 19%
    inv.iva5  || '',       // L  IVA 5%
    '',                    // M  OTROS IMP
    inv.ipo   || '',       // N  IPO
    inv.total,             // O  VR TOTAL
    rf  || '',             // P  RF     (sugerido por el motor 2026)
    ica || '',             // Q  R.ICA  (sugerido)
    '',                    // R  R.IVA  (manual)
    vrPagar,               // S  VR PAGAR
    flag,                  // T  REVISAR (si hay retención sugerida a validar)
    ''                     // U  FORMA PAGO (manual)
  ]]);
}

/* ───────────────── Drive: carpeta EMITIDAS del mes (crea si falta) ───────────────── */
function driveRoot_() {
  if (CONFIG.DRIVE_ROOT_ID) return DriveApp.getFolderById(CONFIG.DRIVE_ROOT_ID);
  const it = DriveApp.getFoldersByName(CONFIG.DRIVE_ROOT_NAME);
  if (!it.hasNext()) throw new Error('No encuentro la carpeta ' + CONFIG.DRIVE_ROOT_NAME);
  return it.next();
}
function childContaining_(parent, needle, createName) {
  const it = parent.getFolders(); needle = needle.toUpperCase();
  while (it.hasNext()) { var f = it.next(); if (f.getName().toUpperCase().indexOf(needle) > -1) return f; }
  return createName ? parent.createFolder(createName) : null;
}
function getEmitidasFolder_(mes) {
  const anio = childContaining_(driveRoot_(), String(CONFIG.ANIO), String(CONFIG.ANIO));
  const mesF = childContaining_(anio, mes, mes); // "6 JUNIO"/"ABRIL": basta con que el nombre contenga el mes
  return childContaining_(mesF, 'EMITIDAS', 'EMITIDAS ' + mes + ' ' + CONFIG.ANIO);
}

/* ───────────────── Sheet: pestaña del mes + última fila con datos ───────────────── */
function getMonthSheet_(ss, mes) {
  const exact = ss.getSheetByName(mes + ' ' + CONFIG.ANIO);
  if (exact) return exact;
  const sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++)
    if (sheets[i].getName().toUpperCase().indexOf(mes) > -1) return sheets[i];
  throw new Error('No encuentro la pestaña del mes ' + mes);
}
function findLastDataRow_(sh) {
  const n = Math.max(sh.getMaxRows() - 2, 1);
  const col = sh.getRange(3, 5, n, 1).getValues(); // col E = NOMBRE, desde fila 3
  let last = 2;
  for (var i = 0; i < col.length; i++) if (String(col[i][0]).trim() !== '') last = i + 3;
  return last;
}

/* ───────────────── XML helpers (por nombre local, ignorando namespaces) ───────────────── */
function firstByName_(el, name) {
  if (!el) return null;
  const kids = el.getChildren();
  for (var i = 0; i < kids.length; i++) {
    if (kids[i].getName() === name) return kids[i];
    var deep = firstByName_(kids[i], name);
    if (deep) return deep;
  }
  return null;
}
function allByName_(el, name, acc) {
  acc = acc || [];
  if (!el) return acc;
  el.getChildren().forEach(function (k) { if (k.getName() === name) acc.push(k); allByName_(k, name, acc); });
  return acc;
}
function textByName_(el, name) { const f = firstByName_(el, name); return f ? f.getText().trim() : ''; }
function money_(s) { if (!s) return 0; var n = parseFloat(String(s).replace(/[$,\s]/g, '')); return isNaN(n) ? 0 : n; }

/* ───────────────── Gmail labels + dedup ───────────────── */
function getOrCreateLabel_(name) { return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name); }
function addLabel_(thread, name) { thread.addLabel(getOrCreateLabel_(name)); }
function yaProcesada_(cufe) { return !!(cufe && PropertiesService.getScriptProperties().getProperty('cufe_' + cufe)); }
function marcarProcesada_(cufe) { if (cufe) PropertiesService.getScriptProperties().setProperty('cufe_' + cufe, '1'); }

/* ───────────────── Instalar el trigger de 5 min ───────────────── */
function instalarTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runIngesta') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runIngesta').timeBased().everyMinutes(5).create();
  Logger.log('Trigger instalado: runIngesta cada 5 minutos.');
}
