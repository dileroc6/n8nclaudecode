-- ============================================================================
-- ToqueFlow — El límite de conocimiento, visible para el cliente
-- ----------------------------------------------------------------------------
-- El cliente debe poder ver cuánto espacio lleva usado ANTES de pasarse, y qué
-- implica pasarse. Para eso el límite tiene que vivir en UN solo lugar: si el
-- número está repetido en la edge function, en la pantalla y en el contrato,
-- tarde o temprano dejan de coincidir y el cliente ve una cosa mientras el
-- sistema hace otra.
--
-- Se define aquí, y la vista entrega el estado ya calculado. La pantalla solo
-- lo muestra; no vuelve a hacer la cuenta.
--
-- Requisitos: correr PRIMERO schema-agente.sql. Idempotente.
-- ============================================================================

-- ── El límite, en un solo sitio ──────────────────────────────────────────────
-- 40 KB ≈ 11.000 tokens. No es un límite de la ventana del modelo (Haiku 4.5
-- tiene 200.000): es de COSTO, porque el documento entra en cada llamada.
-- Sin caché de prompt, un cliente activo con 40 KB cuesta ~50 USD/mes en IA
-- —el 34% de lo que paga— y con caché baja a ~12. Ver
-- ToqueFlow/estrategia/producto-estandar.md § La economía por mensaje.
create or replace function public.tf_limite_conocimiento_bytes()
returns int language sql immutable as $$ select 40000 $$;

-- ── La vista ahora dice también cómo va el cliente ───────────────────────────
-- Se elimina antes de recrear: `create or replace view` no permite cambiar el
-- tipo de una columna existente, y aquí bytes_total pasa de bigint a int.
drop view if exists public.agent_knowledge_prompt;
create view public.agent_knowledge_prompt as
with acumulado as (
  select
    company_id,
    string_agg('## ' || titulo || E'\n' || contenido, E'\n\n' order by orden, created_at) as texto,
    sum(bytes)::int     as bytes_total,
    count(*)::int       as fuentes,
    max(actualizado_at) as actualizado_at
  from public.agent_knowledge
  where activo
  group by company_id
)
select
  a.*,
  public.tf_limite_conocimiento_bytes() as bytes_limite,
  least(100, round(a.bytes_total * 100.0 / public.tf_limite_conocimiento_bytes()))::int as pct_usado,
  case
    when a.bytes_total >  public.tf_limite_conocimiento_bytes()        then 'excedido'
    when a.bytes_total >= public.tf_limite_conocimiento_bytes() * 0.75 then 'cerca'
    else 'ok'
  end as estado
from acumulado a;

-- Los permisos se pierden al recrear la vista: se vuelven a otorgar.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select on public.agent_knowledge_prompt to n8n_worker;
  end if;
end $$;

-- ── Cómo lo usa la pantalla ──────────────────────────────────────────────────
--
--   select bytes_total, bytes_limite, pct_usado, estado
--   from agent_knowledge_prompt where company_id = auth-del-usuario;
--
-- Y muestra, según `estado`:
--
--   ok        → «Usas 12 KB de 40 KB» con la barra en verde. Sin ruido.
--   cerca     → «Vas en 32 KB de 40 KB. Al pasarte, el asistente consume más y
--                el plan se ajusta — escríbenos antes de llegar.»
--   excedido  → «Tu información supera los 40 KB incluidos. El asistente sigue
--                funcionando, pero hablemos para ajustar el plan.»
--
-- NOTA DE PRODUCTO: pasarse NO bloquea ni corta el servicio. Un cliente al que
-- se le apaga el bot por editar su lista de precios llama enojado, con razón.
-- Pasarse abre una conversación comercial, no un error.
