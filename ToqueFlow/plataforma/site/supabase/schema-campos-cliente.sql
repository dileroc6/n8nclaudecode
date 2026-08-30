-- ============================================================================
-- ToqueFlow — Los campos son del cliente, no del agente
-- ----------------------------------------------------------------------------
-- Diego cerró el razonamiento:
--
--   «Toque Atiende debe ser muy general y tener INCLUIDA la herramienta de
--    guardar clientes con campos personalizados, que puedan ser cargados,
--    editados y borrados por el mismo cliente. El cliente decide qué campos.»
--
-- Eso mueve los campos de sitio. Hasta hoy vivían en `agent_config.captura`,
-- o sea: eran del agente. Pero un negocio quiere guardar cosas de su gente
-- aunque el agente no las pregunte —la talla, el cumpleaños, la placa del
-- carro— y quiere poder cambiarlas él, no pedirle a nadie que se las agregue.
--
-- Así que los campos son de la EMPRESA, y el agente solo marca cuáles de ellos
-- debe intentar averiguar en la conversación. Una definición, dos usos:
--
--   la pantalla de contactos    los muestra y los deja editar
--   el agente                   pregunta por los que estén marcados
--
-- Esto es lo que hace que «guardar clientes con campos propios» sea parte del
-- producto estándar y no una herramienta que se enciende: le sirve igual a una
-- tienda, a un hotel y a un gimnasio, que era la regla.
--
-- Idempotente.
-- ============================================================================


-- ── Los campos que define cada negocio ───────────────────────────────────────
create table if not exists public.contact_campos (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  -- El nombre con el que se guarda el dato. Es lo que el agente devuelve y lo
  -- que queda en la ficha, así que no se cambia a la ligera.
  clave      text not null,
  etiqueta   text not null,

  -- `texto` es lo normal. `opciones` obliga a elegir de una lista, y eso es lo
  -- que convierte un texto en un dato: sin lista, «qué plan te interesa»
  -- devuelve cuatro maneras de decir lo mismo y después nadie puede contar.
  tipo       text not null default 'texto'
             check (tipo in ('texto', 'opciones', 'numero', 'fecha')),
  opciones   text[] not null default '{}',

  -- Si el agente debe intentar averiguarlo conversando. Un campo puede existir
  -- para la ficha sin que el agente lo pregunte: la placa del carro se anota,
  -- no se pregunta por WhatsApp.
  capturar   boolean not null default false,
  obligatorio boolean not null default false,

  orden      int not null default 100,
  created_at timestamptz not null default now(),

  unique (company_id, clave)
);

comment on table public.contact_campos is
  'Los campos que cada negocio quiere guardar de su gente. Son de la EMPRESA, no del agente: la pantalla de contactos los muestra y el agente pregunta solo por los marcados con capturar.';

create index if not exists contact_campos_company_idx on public.contact_campos (company_id, orden);


-- ── Se traen los que ya estaban definidos en los agentes ─────────────────────
insert into public.contact_campos (company_id, clave, etiqueta, tipo, opciones, capturar, obligatorio, orden)
select
  c.company_id,
  x->>'clave',
  coalesce(nullif(x->>'etiqueta', ''), x->>'clave'),
  case when jsonb_array_length(coalesce(x->'opciones', '[]'::jsonb)) > 0 then 'opciones' else 'texto' end,
  case when jsonb_typeof(x->'opciones') = 'array'
       then array(select jsonb_array_elements_text(x->'opciones')) else '{}' end,
  true,
  coalesce((x->>'obligatorio')::boolean, false),
  (row_number() over (partition by c.company_id order by ord))::int * 10
from public.agent_config c,
     lateral jsonb_array_elements(coalesce(c.captura->'campos', '[]'::jsonb)) with ordinality as t(x, ord)
where nullif(x->>'clave', '') is not null
on conflict (company_id, clave) do nothing;


-- ── Permisos: el cliente maneja los suyos ────────────────────────────────────
-- Que el cliente pueda crear, editar y borrar sus propios campos es el punto de
-- todo esto. Si tuviera que pedírselo a ToqueFlow, cada ajuste menor volvería a
-- pasar por una persona.
alter table public.contact_campos enable row level security;

drop policy if exists contact_campos_select on public.contact_campos;
create policy contact_campos_select on public.contact_campos
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists contact_campos_manage on public.contact_campos;
create policy contact_campos_manage on public.contact_campos
  for all to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id())
  with check (public.is_super_admin() or company_id = public.my_company_id());

grant select, insert, update, delete on public.contact_campos to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select on public.contact_campos to n8n_worker;
  end if;
end $$;


-- ── El agente pregunta por los que estén marcados ────────────────────────────
-- La captura deja de leerse de `agent_config` y pasa a salir de aquí. Así el
-- cliente cambia un campo desde su portal y el agente se entera en el siguiente
-- mensaje, sin que nadie toque la configuración del agente.
-- La definición de `tf_agente_contexto` VIVÍA AQUÍ y se movió a
-- schema-agente-contexto.sql, que es el único archivo que la define.
--
-- Estaba repetida en nueve archivos: reaplicar cualquiera de los viejos la
-- devolvía a una versión anterior en silencio. Lo que este archivo hace
-- además sigue abajo.


revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
  end if;
end $$;
