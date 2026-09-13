---
name: migracion-supabase
description: Escribir y aplicar un cambio de esquema en la base de ToqueFlow (tabla nueva, columna, vista, función, RLS, permisos). Úsalo cuando haya que tocar Supabase — crear o modificar estructura, agregar una política, cambiar una función existente — y para revisar que lo escrito se pueda volver a correr sin romper nada.
---

# Un cambio de esquema en ToqueFlow

## La regla que lo gobierna todo

**Todo esquema es idempotente: correrlo dos veces da lo mismo que correrlo una.**

No es estética. De eso depende poder arreglar algo a las once de la noche sin preguntarse «¿esto ya lo corrí?», y poder levantar la base de cero el día que haga falta.

```
node pruebas/seguridad/migraciones-sanas.cjs
```

Lee los 58 archivos y busca las formas conocidas de no ser idempotente. **Córrelo antes de dar por bueno un archivo nuevo.**

## Cómo se escribe

Un archivo por tema en `ToqueFlow/plataforma/site/supabase/schema-<tema>.sql`. **No van numerados** — van nombrados por lo que hacen, y se corren cuando toca.

```sql
-- ============================================================================
-- <Qué resuelve, en una línea>
-- ----------------------------------------------------------------------------
-- POR QUÉ EXISTE: <el problema real, con el caso que lo destapó>
--
-- Requiere: schema-negocio.sql. Idempotente.
-- ============================================================================

create table if not exists public.cosa ( ... );
alter table public.cosa add column if not exists nueva text;
create index if not exists cosa_algo_idx on public.cosa (algo);
create or replace function public.tf_algo(...) ...
drop policy if exists cosa_suya on public.cosa;
create policy cosa_suya on public.cosa ...
```

| Para esto | Se escribe así |
|---|---|
| tabla | `create table if not exists` |
| columna | `alter table ... add column if not exists` |
| índice | `create index if not exists` |
| función | `create or replace` |
| política | `drop policy if exists` y luego `create policy` |
| vista | `drop view if exists` y luego `create view` |
| tipo | no acepta `if not exists`: va en un `do $$ ... exception when duplicate_object then null; end $$` |

**Lo que nunca va en un esquema:** `drop table`, `drop column`, `truncate`, un `delete from` sin `where`. Si de verdad hay que borrar algo, va en un script aparte que alguien corre a conciencia, no en un archivo que se vuelve a correr solo.

## Lo que no se negocia en una tabla nueva

```sql
company_id uuid not null references public.companies (id) on delete cascade,
```

Y después, siempre:

```sql
alter table public.cosa enable row level security;

drop policy if exists cosa_suya on public.cosa;
create policy cosa_suya on public.cosa
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());
```

**Una tabla sin RLS le entrega todo a cualquiera con la llave pública.** `tf_aislamiento()` las caza, y el cron semanal lo corre — pero que lo cace la semana que viene no es lo mismo que escribirlo bien hoy.

## Las vistas: la trampa que ya mordió dos veces

```sql
create view public.algo with (security_invoker = on) as ...
```

**Sin eso, la vista corre con los permisos de quien la creó** —no de quien la consulta—, atraviesa el RLS y entrega los datos de todos los clientes. Ya pasó con dos vistas y se descubrió probando desde afuera con la llave pública, no leyendo código.

Ojo con el detalle: Postgres lo guarda como `security_invoker=on`, **no** `=true`. Un chequeo que buscaba `true` marcó como agujero las 12 vistas correctas del proyecto.

## Cambiar una función que ya existe

Dos caminos, y el segundo tiene filo:

**Reescribirla entera** — claro y seguro, pero si es larga acabas manteniendo dos copias, y la que se quede vieja rompe algo en silencio.

**Parchearla con `replace` sobre `pg_get_functiondef()`** — sirve para tocar una línea de una función larga, pero:

```sql
-- Cuenta las ocurrencias del ancla ANTES de reemplazar.
v_veces := (length(v_def) - length(replace(v_def, v_ancla, ''))) / length(v_ancla);
if v_veces <> 1 then
  raise exception 'el ancla aparece % veces, tiene que aparecer 1 — revisar a mano', v_veces;
end if;
```

Un ancla que pegó en dos sitios —`'asignado_humano'`, que es a la vez la clave del JSON y el campo de donde sale su valor— dejó `tf_agente_contexto` rota **para todos los clientes**, y el agente dejó de contestar.

## Aplicar

```
node pruebas/aplicar.cjs schema-<tema>.sql
```

Si falla, dice el mensaje de Postgres y el trozo de SQL donde pasó. Errores que salen seguido:

| Lo que dice | Qué es |
|---|---|
| `cannot cast type record to boolean` | un `replace` pegó donde no era |
| `malformed array literal` | `v_arr \|\| 'texto'` necesita `'texto'::text` |
| `could not determine data type of parameter $1` | hace falta `$1::jsonb` |
| `bind message supplies 2 parameters` | la consulta usa `$1` y le mandaste dos |
| `operator does not exist: json @> jsonb` | `json` y `jsonb` no son lo mismo |

## Antes de dar nada por bueno

```
node pruebas/seguridad/migraciones-sanas.cjs   ← ¿se puede volver a correr?
node pruebas/todo.cjs                          ← ¿rompiste algo?
```

Y si tocaste algo que usan todos —el contexto del agente, una vista compartida, una función de herramienta— **corre también los 18 escenarios de Bejauha.** Es el cliente que paga.

## El hueco conocido: el orden

Solo **23 de 58** archivos dicen de qué dependen. Mientras la base esté viva no molesta, porque cada archivo se corre cuando toca. Pero el día que haya que levantarla de cero, **el orden no está escrito en ninguna parte**.

No hay que arreglar los 58. Hay que escribir `Requiere: <archivo>` en la cabecera de **cada archivo nuevo**, para que el problema deje de crecer.

## Y una lección sobre los chequeos

Los dos chequeos que escribí esta semana **gritaron lobo antes de servir**: uno marcó como agujero las 12 vistas correctas, el otro marcó 2 índices perfectos.

> Un chequeo que grita lobo se acaba ignorando, y el día que grite de verdad nadie va a mirar.

Así que a todo chequeo nuevo se le hacen **las dos pruebas**:

1. **que no marque lo bueno** — córrelo contra el código actual: tiene que salir limpio
2. **que sepa fallar** — sabotea algo a propósito, comprueba que lo caza, y deshaz el sabotaje
