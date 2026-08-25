# ToqueFlow — la empresa

Esta carpeta es **el nivel Toque**: la estrategia, la arquitectura de la plataforma y las automatizaciones que ToqueFlow construye **para sí mismo**.

Sigue la misma convención que las carpetas de cliente (`Bejauha/`, `Savia/`, `Zoe/`) y no es casualidad: por decisión de arquitectura, **ToqueFlow se da de alta como una empresa más en su propia plataforma**. Sus prospectos viven en `contacts` con `status='prospecto'`, reusando la vista Prospectos de `contactos.html` y `campanas.html` igual que cualquier cliente.

> No confundir con `Websites/toqueflow/`, que es **el código** del sitio y del portal.
> Aquí vive el negocio; allá vive la implementación.

---

## Qué hay aquí

```
ToqueFlow/
├── TABLERO.md          ← estado vivo de las tareas del proyecto (empezar por aquí)
├── TABLERO.html        ← el mismo tablero, para abrir en el navegador
├── estrategia/
│   └── captacion-leads.md   ← cómo consigue clientes ToqueFlow
├── arquitectura/
│   ├── arquitectura-toque.md      ← las 3 reglas de oro + diagramas
│   ├── contrato-n8n.md            ← eventos, payloads, auth entre plataforma y n8n
│   └── modo-prueba-sandbox.md     ← probar flujos sin WhatsApp real
├── workflows/          ← los JSON de n8n de la máquina de leads
└── prompts/            ← prompts del scoring y de los correos outbound
```

**`arquitectura/` es canónico.** Esos tres documentos describen cómo funciona la plataforma para *todos* los clientes, no solo para uno. Antes vivían duplicados en `Websites/toqueflow/_docs/` y en `Bejauha/docs/`; ahora hay una sola copia y los demás apuntan aquí.

---

## La máquina de leads

El proyecto activo de esta carpeta. Resumen en una línea: construir para ToqueFlow la misma máquina que ToqueFlow le vende a sus clientes.

- **Estrategia completa:** [estrategia/captacion-leads.md](estrategia/captacion-leads.md)
- **Estado y tareas:** [TABLERO.md](TABLERO.md)

Lo que ya está escrito y espera para correr:

| Archivo | Qué hace |
|---|---|
| `../Websites/toqueflow/seed-toqueflow.cjs` | Da de alta ToqueFlow como empresa con sus 4 flows. **Falta completar el bloque `USER`** |
| `../Websites/toqueflow/site/supabase/schema-prospeccion.sql` | Índice único por `place_id`, `outreach_events`, `outreach_optouts` y `demos`, con RLS |

Esos dos viven allá a propósito: el seed va junto a los demás `seed-*.cjs`, y el schema junto a `schema.sql` y `schema-negocio.sql`, que se corren en orden.

---

## Reglas al trabajar aquí

1. **El modelo de datos ya existe.** `contacts`, `campaigns`, `campaign_runs` y `message_log` sirven para prospección tal cual. Antes de crear una tabla, revisar si `metadata` (jsonb) resuelve el caso.
2. **WhatsApp jamás en frío.** El canal de primer contacto es email. WhatsApp entra solo después de que el prospecto responda. Hay antecedente de baneo: ver el incidente en [../Bejauha/docs/estado-mvp.md](../Bejauha/docs/estado-mvp.md).
3. **Consultar `outreach_optouts` antes de cada envío.** Es obligación legal, no una buena práctica.
4. **Validar a mano antes de automatizar.** Un mensaje que no funciona, automatizado, solo quema el dominio más rápido.
5. **Tono de cara al usuario:** español neutro (Colombia).
