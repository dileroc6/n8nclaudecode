// ============================================================================
// Zoe Tantric SPA — Validación de disponibilidad de slot
// ============================================================================
// Modo recomendado: "Run Once for Each Item".
//
// Inputs esperados en $json (preparados por nodos Postgres previos):
//   slot.terapeuta_id              (UUID)
//   slot.terapeuta_secundario_id   (UUID, opcional — para servicios de pareja con 2 terapeutas)
//   slot.sede_id                   (UUID)
//   slot.slot_inicio               (ISO 8601 con offset -05:00)
//   slot.duracion_minutos          (number, viene del servicio elegido)
//   horario_base_principal         (jsonb del terapeuta principal)
//   horario_base_secundario        (jsonb del secundario, opcional)
//   citas_existentes               (array de {slot_inicio, slot_fin} de ambos terapeutas y la sede)
//   bloqueos                       (array de {inicio, fin, terapeuta_id, sede_id, motivo})
//
// Output:
//   { disponible: bool, motivo: string, slot_inicio, slot_fin, duracion_minutos, ... }
//
// Esta función es PRE-validación rápida. La red de seguridad real es la
// función zoe.fn_slot_disponible + el EXCLUDE constraint en zoe.citas:
// capturar errcode 23P01 en el INSERT y responder "ya no disponible".
// ============================================================================

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function toDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Fecha inválida: ${iso}`);
  return d;
}

function rangosSeSolapan(aIni, aFin, bIni, bFin) {
  return aIni < bFin && bIni < aFin;
}

function dentroDeHorarioBase(slotIni, slotFin, horarioBase) {
  const dia = DIAS[slotIni.getDay()];
  const franjas = (horarioBase || {})[dia] || [];
  if (!franjas.length) return false;

  const y = slotIni.getFullYear();
  const m = slotIni.getMonth();
  const d = slotIni.getDate();

  return franjas.some(({ inicio, fin }) => {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    const fIni = new Date(y, m, d, hi, mi, 0, 0);
    const fFin = new Date(y, m, d, hf, mf, 0, 0);
    return slotIni >= fIni && slotFin <= fFin;
  });
}

const item = $input.item.json;
const slot = item.slot || {};

if (!slot.terapeuta_id || !slot.sede_id || !slot.slot_inicio || !slot.duracion_minutos) {
  return { json: { disponible: false, motivo: 'input_incompleto' } };
}

const slotIni = toDate(slot.slot_inicio);
const slotFin = new Date(slotIni.getTime() + slot.duracion_minutos * 60_000);

if (slotIni < new Date()) {
  return { json: { disponible: false, motivo: 'fecha_en_pasado' } };
}

if (!dentroDeHorarioBase(slotIni, slotFin, item.horario_base_principal)) {
  return { json: {
    disponible: false,
    motivo: 'fuera_de_horario_base',
    terapeuta: 'principal',
    slot_inicio: slotIni.toISOString(),
    slot_fin: slotFin.toISOString(),
  }};
}

if (slot.terapeuta_secundario_id && !dentroDeHorarioBase(slotIni, slotFin, item.horario_base_secundario)) {
  return { json: {
    disponible: false,
    motivo: 'fuera_de_horario_base',
    terapeuta: 'secundario',
    slot_inicio: slotIni.toISOString(),
    slot_fin: slotFin.toISOString(),
  }};
}

for (const c of (item.citas_existentes || [])) {
  if (rangosSeSolapan(slotIni, slotFin, toDate(c.slot_inicio), toDate(c.slot_fin))) {
    return { json: {
      disponible: false,
      motivo: 'solape_con_cita',
      cita_conflicto: { slot_inicio: c.slot_inicio, slot_fin: c.slot_fin, terapeuta_id: c.terapeuta_id },
      slot_inicio: slotIni.toISOString(),
      slot_fin: slotFin.toISOString(),
    }};
  }
}

for (const b of (item.bloqueos || [])) {
  // Filtrar bloqueos que aplican: del terapeuta (principal o secundario), de la sede, o globales
  const aplica =
    !b.terapeuta_id || b.terapeuta_id === slot.terapeuta_id || b.terapeuta_id === slot.terapeuta_secundario_id;
  const aplicaSede =
    !b.sede_id || b.sede_id === slot.sede_id;
  if (!aplica || !aplicaSede) continue;

  if (rangosSeSolapan(slotIni, slotFin, toDate(b.inicio), toDate(b.fin))) {
    return { json: {
      disponible: false,
      motivo: 'bloqueo_admin',
      bloqueo: { inicio: b.inicio, fin: b.fin, motivo: b.motivo || null },
      slot_inicio: slotIni.toISOString(),
      slot_fin: slotFin.toISOString(),
    }};
  }
}

return { json: {
  ...item,
  disponible: true,
  motivo: 'ok',
  slot_inicio: slotIni.toISOString(),
  slot_fin: slotFin.toISOString(),
  duracion_minutos: slot.duracion_minutos,
}};
