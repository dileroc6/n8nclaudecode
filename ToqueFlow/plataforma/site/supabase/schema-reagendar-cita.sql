-- ============================================================================
-- ToqueFlow — Mover la cita, no cancelarla
-- ----------------------------------------------------------------------------
-- El hueco que destapó el lead de clínicas de Workana. Su «Blindaje de Agenda»
-- pide confirmaciones, recordatorios, **cambios** y cancelaciones. Teníamos
-- tres de cuatro.
--
-- Y el que faltaba es el que más plata mueve. Lo primero que contesta alguien a
-- un recordatorio no es «sí» ni «no»:
--
--     «no puedo el jueves, ¿me lo pasas al viernes?»
--
-- Hoy el agente lo trata como cancelación. El paciente se queda sin cita, la
-- clínica pierde un ingreso que YA TENÍA, y encima la persona tiene que volver
-- a escribir para agendar. Es peor que no ofrecer la función.
--
-- Mover una cita no es cancelar y crear: es una sola operación que tiene que
-- ser atómica. Si se cancelara primero y la hora nueva estuviera ocupada, la
-- persona se queda sin ninguna de las dos — el peor final posible.
--
-- Idempotente.
-- ============================================================================

-- tf_tool_reagendar_cita NO se define aqui: vive en schema-fecha-y-hora.sql.
--
-- Estaba definida en los dos archivos, con cuerpos distintos. Reaplicar los
-- esquemas en un orden u otro decidia en silencio cual de las dos corria — y
-- eso rompio la herramienta de verdad: misma causa: aqui pedia un ISO, y la buena pide fecha y hora por separado.
--
-- Una funcion, un archivo. `pruebas/calidad/una-funcion-un-archivo.cjs` lo
-- vigila.

revoke all on function public.tf_tool_reagendar_cita(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_reagendar_cita(jsonb) to n8n_worker;
  end if;
end $$;


-- ── El catálogo ──────────────────────────────────────────────────────────────
insert into public.catalogo
  (clave, nombre, tipo, descripcion, beneficio, instruccion, workflow, entrada,
   liberado, activo, visible_cliente, orden, estado)
values (
  'reagendar-cita', 'Mover la cita', 'herramienta',
  'Cuando la persona no puede a la hora que tenia, el agente le mueve la cita a otra en vez de cancelarla.',
  'Una cita que se mueve sigue siendo un ingreso; una que se cancela hay que volver a venderla.',
  -- Para el modelo: cuándo llamarla, y la distinción que importa.
  'ÚSALA EN CUANTO LA PERSONA PIDA CAMBIAR DE HORA una cita que ya tiene — «no puedo el jueves», «¿me lo pasas al viernes?», «se me cruzo». NO uses confirmar_cita para eso: confirmar con «no» CANCELA, y la persona queria mover, no cancelar. Si todavia no te dijo para cuando, preguntale primero y consulta las horas libres.',
  'tool-reagendar-cita',
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'nuevo_inicio', jsonb_build_object(
        'type', 'string',
        'description', 'La hora nueva, en formato ISO con la hora de Colombia. Ejemplo: 2026-09-18T15:00:00-05:00. Usa la fecha de HOY que aparece arriba para calcular «el viernes» o «manana». Si no estas seguro, pregunta en vez de adivinar.')),
    'required', jsonb_build_array('nuevo_inicio')),
  true, true, true, 34, 'funcionando')
on conflict (clave) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion,
  beneficio = excluded.beneficio, instruccion = excluded.instruccion,
  workflow = excluded.workflow, entrada = excluded.entrada,
  liberado = excluded.liberado, activo = excluded.activo, estado = excluded.estado;


-- Entra en Toque Agenda: mover una cita es parte de gestionarla, no un pin
-- aparte. Quien compró el pin la hereda sin que nadie toque su configuración —
-- para eso los paquetes se expanden al usar y no al contratar.
update public.catalogo
   set contiene = array['ver-disponibilidad', 'agendar-cita', 'recordatorio-cita',
                        'confirmar-cita', 'reagendar-cita']
 where clave = 'paquete-agenda';
