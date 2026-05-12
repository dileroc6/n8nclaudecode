// ============================================================================
// Zoe Tantric SPA — Generador de OTP de check-in
// ============================================================================
// Modo: "Run Once for All Items".
//
// Política (confirmada con el equipo):
//   - El OTP NO se genera al crear la reserva.
//   - Se genera por un cron (WF5 OTP Generator) a partir de slot_inicio + 30 min.
//   - Ventana de validez: 1 hora desde la generación → otp_expira_at = NOW() + 1h.
//   - Si el cliente no envía el OTP dentro de esa ventana, fn_marcar_otp_expirados
//     pasa la cita a 'no_show' (reversible por admin).
//
// Inputs en $json (vienen de zoe.fn_citas_pendientes_otp en el cron):
//   id (cita), cliente_id, cliente_whatsapp, pareja_whatsapp, slot_inicio, ...
//
// Output: agrega otp_code + otp_expira_at para que el siguiente nodo Postgres
// haga UPDATE y el HTTP node envíe el mensaje al cliente.
//
// Filtra códigos triviales que confunden a clientes y bajan la legitimidad.
// ============================================================================

const crypto = require('crypto');

const PROHIBIDOS = new Set([
  '0000', '1111', '2222', '3333', '4444',
  '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '9876',
  '1122', '2211', '1212', '2121',
]);

function generarOTP() {
  for (let i = 0; i < 12; i++) {
    const n = crypto.randomInt(0, 10000);
    const code = String(n).padStart(4, '0');
    if (!PROHIBIDOS.has(code)) return code;
  }
  return String(crypto.randomInt(1000, 10000));
}

const VENTANA_MS = 60 * 60 * 1000;  // 1 hora

return $input.all().map(item => {
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + VENTANA_MS);

  return {
    json: {
      ...item.json,
      otp_code: generarOTP(),
      otp_generado_at: ahora.toISOString(),
      otp_expira_at: expira.toISOString(),
    },
  };
});
