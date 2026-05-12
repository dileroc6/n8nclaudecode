// ============================================================================
// Zoe SPA — Política de reprogramaciones
// ============================================================================
// Modo: "Run Once for All Items".
//
// Inputs en $json:
//   cliente.contador_reprogramaciones (number)
//   cliente.bloqueado                 (boolean)
//
// Output: agrega item.json.reprogramacion = { permitido, accion, ... }
//
// El contador se incrementa SOLO al confirmar una reprogramación, vía
// zoe.fn_incrementar_reprogramacion(cliente_id) en un nodo Postgres posterior.
// La cita ejecutada NO resetea el contador automáticamente; si se decide
// "borrón y cuenta nueva" cada N citas exitosas, hay que hacerlo explícito.
// ============================================================================

const LIMITE = 3;

return $input.all().map(item => {
  const cliente = item.json.cliente || {};
  const contador = Number(cliente.contador_reprogramaciones ?? 0);
  const restantes = Math.max(0, LIMITE - contador);

  let permitido, accion, mensaje_interno;

  if (cliente.bloqueado) {
    permitido = false;
    accion = 'cliente_bloqueado';
    mensaje_interno = 'Cliente marcado como bloqueado en clientes.bloqueado=true';
  } else if (contador >= LIMITE) {
    permitido = false;
    accion = 'escalar_admin';
    mensaje_interno = `Cliente alcanzó el límite de ${LIMITE} reprogramaciones`;
  } else {
    permitido = true;
    accion = 'continuar';
    mensaje_interno = `Reprogramación ${contador + 1}/${LIMITE}`;
  }

  return {
    json: {
      ...item.json,
      reprogramacion: {
        permitido,
        accion,
        contador_actual: contador,
        contador_proximo: contador + 1,
        restantes,
        limite: LIMITE,
        mensaje_interno,
      },
    },
  };
});
