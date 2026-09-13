---
name: nueva-herramienta
description: Construir una herramienta nueva del agente de ToqueFlow (buscar algo, registrar algo, consultar algo) de punta a punta — función en Supabase, workflow en n8n, catálogo y pruebas. Úsalo cuando se pida agregar una capacidad al agente, una «tool», un flow nuevo, o cuando un cliente pida algo que el agente todavía no sabe hacer.
---

# Una herramienta nueva del agente

## Lo que hay que entender antes de escribir una línea

**El workflow del agente es UNO SOLO para todos los clientes y no sabe nada de herramientas concretas.** Las recibe del catálogo, en tiempo de ejecución. Eso es lo que hace que agregar una herramienta no sea tocar el agente.

```
  catalogo (fila)  →  tf_agente_contexto()  →  el prompt se las declara a Claude
                                                        ↓
                              Claude pide una  →  n8n la ejecuta por su webhook
```

Si terminas editando `agente-atencion-generico.json` para agregar una herramienta, **te equivocaste de camino**: eso rompe a todos los clientes a la vez.

## La regla que decide qué puede hacer

Antes de nada, contesta esto: **¿lo que va a hacer compromete al negocio?**

| Si compromete plata, inventario o una promesa | Si solo informa |
|---|---|
| la herramienta **deja el registro**, no lo aplica | hace lo suyo y ya |
| devuelve `aplicado: false` o `verificado: false` **explícito** | |
| lo confirma una persona desde el portal | |

Sin el `false` explícito, **el agente lo redondea a «listo»**. Ya pasó: el pedido quedaba armado y el agente contestaba «pedido confirmado».

## Los cinco pasos, en orden

### 1. La función en Supabase

Archivo nuevo en `ToqueFlow/plataforma/site/supabase/schema-<algo>.sql`. **Idempotente siempre.**

```sql
create or replace function public.tf_tool_<lo_que_hace>(p_payload jsonb)
returns json language plpgsql volatile
security definer set search_path = public
as $fn$
declare v_company uuid; v_c public.contacts%rowtype;
begin
  -- La empresa se deriva de la INSTANCIA, nunca llega en el payload. Si una
  -- herramienta aceptara la empresa de afuera, bastaría un error del agente
  -- para tocarle los datos a otro cliente.
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_payload->>'instance';
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;
  ...
end; $fn$;
```

**Lo que no se negocia:**

- La empresa sale de `whatsapp_instance`. **Nunca** del payload.
- Los teléfonos se comparan con `public.tf_telefono()` en los **dos** lados.
- Si la herramienta registra algo de una persona, usa `public.tf_contacto_asegurar()`: el contacto se crea al **guardar el turno**, o sea *después* de ejecutar la herramienta, así que en el primer mensaje de alguien nuevo no existe todavía.
- Un precio, un saldo o un número **sale de la base, jamás del modelo**.
- Distingue «no sé» de «no hay»: `null` y `0` no son lo mismo, y decir «no hay» cuando no se sabe es una venta perdida.
- `grant execute ... to n8n_worker` al final, dentro de un `do $$ ... if exists (select 1 from pg_roles where rolname = 'n8n_worker') ...`.

### 2. El workflow en n8n

Tres nodos, siempre los mismos. Copia `ToqueFlow/workflows/tool-registrar-reclamo.json` y cambia el `path` y el nombre de la función.

```
Entrada (webhook, headerAuth) → Extraer (code) → Ejecutar (postgres)
```

- **La firma es obligatoria.** Credencial `Toque - Firma del agente 2026-08-28`.
- **Todo viaja como UN jsonb.** El nodo de Postgres parte los parámetros por coma, y por ahí pasan nombres escritos por personas.
- `settings.errorWorkflow` apuntando a `Toque - Algo fallo` (id `Hjg94IM97CaNuEGp`). **Un flujo que falla en silencio es como llevó FerreteríaYa 18 días caída sin que nadie lo supiera.**

### 3. La fila del catálogo

```sql
insert into public.catalogo (clave, tipo, nombre, descripcion, instruccion, workflow, entrada, ...)
```

| Campo | Para quién |
|---|---|
| `descripcion` · `beneficio` | **para Ferney y la consola** — qué le resuelve al cliente |
| `instruccion` | **para el modelo** — CUÁNDO llamarla |
| `entrada` | el JSON Schema de los datos que necesita |

**No son el mismo texto.** El modelo leía `beneficio` —«Deja de contestar déjame reviso veinte veces al día»— y eso no le dice cuándo llamar nada. Escribe `instruccion` en segunda persona y empezando por el cuándo:

> «Deja armado el pedido. **ÚSALA EN CUANTO LA PERSONA ACEPTE COMPRAR** —«sí», «hágale», «confirmo»—, antes de contestarle. No existe ningún pedido hasta que la llames.»

Si la herramienta **hace** algo (no solo consulta), dilo así de fuerte. Las de consultar se disparan con una pregunta; las de actuar se disparan **cuando la persona acepta**, y eso hay que decirlo.

### 4. Encenderla para un cliente

`agent_config.herramientas` es un `text[]` de claves del catálogo. Acepta la clave de un **paquete** y la base lo expande a sus piezas, así que el día que el paquete crezca el cliente lo hereda.

### 5. Las pruebas — dos, no una

| Prueba | Qué contesta |
|---|---|
| `pruebas/calidad/<algo>.cjs` | ¿la función hace lo que dice? |
| agregar la ruta a `pruebas/calidad/tools-por-webhook.cjs` | ¿funciona **por su webhook**, que es como la llama el agente? |

Que una función pase en la base **no dice que la herramienta funcione**: entre las dos están la firma, el nodo que arma el jsonb y el de Postgres. Ahí es donde se rompen.

**Y si la herramienta hace algo, el escenario tiene que exigir el HECHO**, no palabras:

```json
"en_la_base": {
  "que": "el pedido tiene que EXISTIR, no solo haberse dicho",
  "consulta": "select count(*)::int n from public.pedidos where company_id=$1 and estado='armado'",
  "al_menos": 1
}
```

Sin eso, «listo, queda anotado tu pedido» pasaba en verde **con cero pedidos creados**.

## Antes de dar nada por bueno

```
node pruebas/todo.cjs
```

Y si tocaste algo compartido —el contexto, el prompt, el receptor— **corre también los 18 de Bejauha**. Es el cliente que paga.

## Trampas que ya mordieron

- **Un `replace` sobre el cuerpo de una función**: cuenta las ocurrencias del ancla y niégate si no es exactamente una. Un ancla que pega en dos sitios rompió `tf_agente_contexto` para todos los clientes.
- **Nombres de variable en los nodos de código**: `sabido`, `base`, `c` ya existen en el nodo del prompt. Un choque tumba al agente entero.
- **Backticks en bash**: se ejecutan como comando y se comen el texto. Los parches al tablero o a los docs van en un archivo `.cjs`, no en una línea de shell.
- **`$2` en una consulta que solo usa `$1`**: Postgres exige el número exacto de parámetros.
- **Dos claves iguales en un objeto literal**: gana la última. Si vas a pisar un valor, ponlo al final.
