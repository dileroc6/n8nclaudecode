#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Importador de la base de seguimiento de Bejauha (CSV de Notion ya organizado)
hacia el esquema `bejauha`. Genera SQL idempotente por stdout.

Uso:
  python3 importar_seguimiento.py "SEGUIMIENTO BJ - Organizado.csv" > 007_import_generado.sql
  docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 007_import_generado.sql

Requisitos: haber corrido antes 006_crm_migracion.sql.
Columnas esperadas (por posición):
  0 Tipificación | 1 Canal | 2 Nombre | 3 ACUERDO | 4 Estado | 5 Estado BE |
  6 Cantidad de clases | 7 Clases faltantes | 8 Consumidas | 9 Paquete |
  10 PRX CONTACTO | 11 Teléfono | 12 INSTAGRAM | 13 ÚLTIMO PAGO
"""
import csv, sys, re, datetime

def sql_str(v):
    if v is None or v == '':
        return 'NULL'
    return "'" + str(v).replace("'", "''") + "'"

def norm_phone(raw):
    """Devuelve E.164 sin '+' o None. Colombia: móvil 10 dígitos que empieza en 3 -> 57XXXXXXXXXX."""
    if not raw:
        return None
    s = raw.strip()
    intl = s.startswith('+')
    d = re.sub(r'\D', '', s)
    if not d:
        return None
    if intl:
        return d                      # ya internacional (+49…, etc.)
    if len(d) == 10 and d[0] == '3':  # móvil colombiano
        return '57' + d
    if len(d) == 12 and d.startswith('57'):
        return d
    if len(d) == 7 or len(d) == 8:    # fijo sin indicativo -> no confiable para WhatsApp
        return None
    if len(d) > 12:                   # incluye país (52…, 1…, 506…)
        return d
    return None                       # caso raro -> sin teléfono

def norm_ig(raw):
    if not raw:
        return None
    s = raw.strip()
    if s.startswith('http') and 'instagram.com' in s:
        return s
    return None  # a veces ponen un teléfono o texto en la columna IG -> ignorar

def parse_prx(raw):
    if not raw: return None
    m = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', raw)
    if not m: return None
    dd, mm, yy = m.groups()
    try:
        return datetime.date(int(yy), int(mm), int(dd)).isoformat()
    except ValueError:
        return None

MESES = {'january':1,'february':2,'march':3,'april':4,'may':5,'june':6,'july':7,
         'august':8,'september':9,'october':10,'november':11,'december':12}
def parse_pago(raw):
    if not raw: return None
    m = re.search(r'([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})', raw)
    if not m: return None
    mon, dd, yy = m.groups()
    mm = MESES.get(mon.strip().lower())
    if not mm: return None
    try:
        return datetime.date(int(yy), int(mm), int(dd)).isoformat()
    except ValueError:
        return None

def to_int(raw):
    if raw is None or str(raw).strip() == '': return None
    try: return int(float(str(raw).replace(',', '.')))
    except ValueError: return None

# La columna ESTADO (col 4) es el discriminador confiable (evita el guión con encoding raro).
# Devuelve (origen, clasificacion, estado_outbound, es_cliente_grupo1)
def classify(estado, estado_be):
    e = (estado or '').strip().lower()
    be = (estado_be or '').lower()
    if 'mensaje enviado' in e:                 return ('outbound', 'frio', 'enviado', False)
    if 'no responde' in e:                     return ('outbound', 'frio', 'sin_respuesta', False)
    if 'cortes' in e and 'consumida' in e:     return ('inbound', 'tibio', None, False)
    if 're agendar' in e or 'reagendar' in e:  return ('inbound', 'tibio', None, False)
    if 'comunidad be' in e:
        if 'no activo' in be:                  return ('import', 'frio', None, False)   # ex-cliente
        return ('import', 'tibio', None, True)                                          # Grupo 1 (activo/pausa/deudor)
    return ('import', None, None, False)

def main(path):
    print("SET search_path TO bejauha, public;")
    print("BEGIN;")
    n_lead = n_saldo = 0
    with open(path, newline='', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if len(row) < 14: row += [''] * (14 - len(row))
            tip_raw, canal_csv, nombre, acuerdo, estado, estado_be, cant, falt, cons, paquete, prx, tel, ig, pago = row[:14]
            nombre = (nombre or '').strip()
            if not nombre:
                continue
            tip = (tip_raw or '').strip()
            origen, clasif, estado_out, es_g1 = classify(estado, estado_be)
            telefono = norm_phone(tel)
            instagram = norm_ig(ig)
            if telefono and instagram: canal = 'ambos'
            elif telefono:             canal = 'whatsapp'
            elif instagram:            canal = 'instagram'
            else:                      canal = 'sin_canal'

            cols = "nombre, origen, clasificacion, estado_outbound, canal, tipificacion, estado_be, paquete, prx_contacto, ultimo_pago, instagram, telefono"
            vals = ", ".join([
                sql_str(nombre), sql_str(origen), sql_str(clasif),
                sql_str(estado_out) if estado_out else 'NULL',
                sql_str(canal), sql_str(tip), sql_str(estado_be or None),
                sql_str(paquete or None), sql_str(parse_prx(prx)), sql_str(parse_pago(pago)),
                sql_str(instagram), sql_str(telefono),
            ])
            if telefono:
                print(f"INSERT INTO bejauha.leads ({cols}) VALUES ({vals}) "
                      f"ON CONFLICT (telefono) DO UPDATE SET nombre=EXCLUDED.nombre, "
                      f"clasificacion=COALESCE(EXCLUDED.clasificacion,bejauha.leads.clasificacion), "
                      f"canal=EXCLUDED.canal, tipificacion=EXCLUDED.tipificacion, estado_be=EXCLUDED.estado_be, "
                      f"paquete=EXCLUDED.paquete, prx_contacto=EXCLUDED.prx_contacto, ultimo_pago=EXCLUDED.ultimo_pago, "
                      f"instagram=COALESCE(EXCLUDED.instagram,bejauha.leads.instagram);")
            elif instagram:
                print(f"INSERT INTO bejauha.leads ({cols}) SELECT {vals} "
                      f"WHERE NOT EXISTS (SELECT 1 FROM bejauha.leads WHERE instagram={sql_str(instagram)});")
            else:
                print(f"INSERT INTO bejauha.leads ({cols}) VALUES ({vals});")
            n_lead += 1

            # Saldo de clases (solo Grupo 1 con teléfono y clases > 0)
            if es_g1 and telefono:
                total = to_int(cant); usad = to_int(cons) or 0
                if total is not None:
                    rest = max(total - usad, 0)
                    tipo = 'virtual' if (paquete and 'VIRTUAL' in paquete.upper()) else 'presencial'
                    paus = 'true' if (estado_be and 'Pausa' in estado_be) else 'false'
                    print(f"INSERT INTO bejauha.saldos_clases (telefono, tipo, clases_restantes, pausado) "
                          f"VALUES ({sql_str(telefono)}, '{tipo}', {rest}, {paus}) "
                          f"ON CONFLICT (telefono, tipo) DO UPDATE SET clases_restantes=EXCLUDED.clases_restantes, pausado=EXCLUDED.pausado;")
                    n_saldo += 1
    print("COMMIT;")
    print(f"-- leads procesados: {n_lead} | saldos sembrados: {n_saldo}", file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 importar_seguimiento.py <archivo.csv> > 007_import_generado.sql", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1])
