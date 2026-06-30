// ============================================================================
// Zoe Tantric SPA — Constructores de payloads para Evolution API
// ============================================================================
// Modo: "Run Once for All Items".
//
// Endpoints (Evolution API v2):
//   POST {base}/message/sendText/{instance}
//
// Headers (configurar en credencial HTTP Header Auth de n8n):
//   apikey: {EVOLUTION_API_KEY}
//   Content-Type: application/json
//
// Formato "number": MSISDN sin '+' ni espacios. Colombia: "573001234567".
//
// Inputs en $json:
//   tipo_mensaje         (uno de los enums abajo)
//   cliente              { whatsapp_id, nombre? }
//   cita?                { slot_inicio, otp_code?, otp_expira_at?, fecha_legible? }
//   servicio?            { nombre, precio_cop, duracion_minutos, modalidad }
//   sede?                { nombre, ciudad, direccion }
//   terapeuta?           { nombre }
//   terapeuta_secundario? { nombre }
//   addons?              [{ nombre, precio_cop }]
//   evolution_base_url
//   evolution_instance
//   texto?               (solo para tipo='texto_libre')
// ============================================================================

function fechaLegible(iso) {
  return new Date(iso).toLocaleString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Bogota',
  });
}

function horaLegible(iso) {
  return new Date(iso).toLocaleString('es-CO', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Bogota',
  });
}

function fmtCOP(n) {
  return Number(n).toLocaleString('es-CO');
}

function payloadTexto({ number, text }) {
  return {
    number,
    text,
    options: { delay: 800, presence: 'composing', linkPreview: false },
  };
}

return $input.all().map(item => {
  const ctx = item.json;
  const number = ctx.cliente?.whatsapp_id;
  if (!number) throw new Error('Falta cliente.whatsapp_id en el contexto');

  let body, endpoint = '/message/sendText';

  switch (ctx.tipo_mensaje) {

    case 'reserva_creada': {
      // Confirmación inmediata al crear la cita. NO incluye OTP — el OTP llega 30 min
      // después del slot_inicio en mensaje 'checkin_otp'.
      const fecha = fechaLegible(ctx.cita.slot_inicio);
      const total = ctx.servicio.precio_cop + (ctx.addons || []).reduce((s, a) => s + a.precio_cop, 0);
      const terapeutas = ctx.terapeuta_secundario
        ? `${ctx.terapeuta.nombre} y ${ctx.terapeuta_secundario.nombre}`
        : ctx.terapeuta.nombre;
      const lineasAddons = (ctx.addons || []).map(a => `• ${a.nombre} — $${fmtCOP(a.precio_cop)}`).join('\n');
      const text =
`✨ *Reserva confirmada — Zoe Tantric SPA*

📅 ${fecha}
💆 ${ctx.servicio.nombre} (${ctx.servicio.duracion_minutos} min)
👤 Terapeuta: ${terapeutas}
📍 ${ctx.sede.nombre} — ${ctx.sede.ciudad}
${lineasAddons ? '\n_Adicionales:_\n' + lineasAddons + '\n' : ''}
💰 Total: $${fmtCOP(total)} COP
💳 Pagas en sitio: efectivo, tarjeta o transferencia QR.

Recibirás un código de validación 30 min después de iniciada tu cita.
¿Necesitas mover o cancelar? Escríbenos por aquí.`;
      body = payloadTexto({ number, text });
      break;
    }

    case 'checkin_otp': {
      // Se envía 30 min después de slot_inicio. Cliente debe responder con el código
      // dentro de 1h (otp_expira_at) para marcar la cita como ejecutada.
      const expira = horaLegible(ctx.cita.otp_expira_at);
      const text =
`Hola ${ctx.cliente.nombre || ''} 🌿

Para validar tu sesión envíanos este código:

*${ctx.cita.otp_code}*

Tienes hasta las ${expira} para enviarlo.`;
      body = payloadTexto({ number, text });
      break;
    }

    case 'ejecutada': {
      body = payloadTexto({
        number,
        text: `✅ Validación recibida. Gracias por tu visita a Zoe. ¡Esperamos verte pronto! 🌿`,
      });
      break;
    }

    case 'cancelacion': {
      body = payloadTexto({
        number,
        text: `Tu cita fue cancelada. Si quieres reagendar, escríbenos cuando puedas. 🙏`,
      });
      break;
    }

    case 'limite_reprogramaciones': {
      body = payloadTexto({
        number,
        text: `Hemos alcanzado el límite de reprogramaciones para tu reserva. Una persona del equipo te contactará para coordinar.`,
      });
      break;
    }

    case 'recordatorio_24h': {
      // NOTA: WF4 actualmente usa un Code node inline ("Construir recordatorio") con
      // 5 variantes aleatorias humanizadas — ver CLAUDE.md §11.5 (2026-05-14).
      // Este case queda como template natural, sin emojis decorativos ni cierre robótico.
      const fecha = fechaLegible(ctx.cita.slot_inicio);
      const terapeutas = ctx.terapeuta_secundario
        ? `${ctx.terapeuta.nombre} y ${ctx.terapeuta_secundario.nombre}`
        : ctx.terapeuta.nombre;
      const nombre = (ctx.cliente?.nombre || '').trim();
      const saludo = nombre ? `Hola ${nombre}` : 'Hola';
      body = payloadTexto({
        number,
        text: `${saludo}, te escribo para recordarte que mañana ${fecha} tienes tu sesión de ${ctx.servicio.nombre} con ${terapeutas} en ${ctx.sede.nombre}. Si necesitas mover algo, me cuentas.`,
      });
      break;
    }

    case 'otp_expirado': {
      body = payloadTexto({
        number,
        text: `Tu código de validación expiró. Si tu sesión sí ocurrió, escríbenos para corregir el registro. 🙏`,
      });
      break;
    }

    case 'texto_libre': {
      if (!ctx.texto) throw new Error('texto_libre requiere ctx.texto');
      body = payloadTexto({ number, text: ctx.texto });
      break;
    }

    default:
      throw new Error(`tipo_mensaje no soportado: ${ctx.tipo_mensaje}`);
  }

  return {
    json: {
      ...ctx,
      evolution_request: {
        url: `${ctx.evolution_base_url}${endpoint}/${ctx.evolution_instance}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
    },
  };
});
