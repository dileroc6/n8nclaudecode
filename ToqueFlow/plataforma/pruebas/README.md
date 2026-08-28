# Pruebas

Cinco scripts. Todos se corren desde `ToqueFlow/plataforma/`.

| Comando | Qué comprueba | Cuesta |
|---|---|---|
| `node pruebas/compila-jsx.cjs` | Que todo el JSX del sitio compile y que el HTML no cargue archivos que no existen | gratis |
| `node pruebas/aislamiento-rls.cjs` | Que **nadie sin sesión** pueda leer datos, usando la llave pública del sitio | gratis |
| `node pruebas/aislamiento-entre-clientes.cjs` | Que **un cliente no pueda ver a otro**. Monta dos empresas de verdad y un usuario de la primera | gratis |
| `node pruebas/consola-agentes.cjs` | Que la pestaña Agentes funcione con una sesión real de super admin y el RLS puesto | gratis |
| `node pruebas/correr-pruebas.cjs` | Los 12 escenarios de conversación contra el agente real | ~$0,06 USD |

## Antes de tocar el agente o el portal, correr las cinco

No es ceremonia. El 27 de agosto de 2026 aparecieron **cinco bugs en un solo día**, y ninguno lo encontró leer código:

- una URL corrompida que mandaba a los clientes a un sitio inexistente
- un header que faltaba y hacía fallar toda llamada al modelo
- el nombre del cliente que el agente decía pero no guardaba
- un trigger que reventaba cualquier `UPDATE` sobre la configuración
- **dos vistas que entregaban la configuración y el conocimiento completos de un cliente a cualquiera, sin iniciar sesión**

El último apareció por casualidad, yendo a construir otra cosa.

## Las dos reglas que salieron de ahí

**El aislamiento se prueba desde afuera.** Todas las pruebas anteriores usaban el rol de servicio o la conexión directa a Postgres, que legítimamente ven todo — por eso salían en verde mientras la puerta estaba abierta. Hay que probar desde donde llegaría un atacante: con la llave pública, sin sesión.

**Toda vista sobre una tabla con RLS nace con `security_invoker = on`.** En Postgres una vista corre con los permisos de su dueño salvo que se le diga lo contrario, así que hereda el RLS de nadie. `aislamiento-rls.cjs` lo comprueba y falla si alguien lo olvida.

## Las pruebas se limpian solas

Crean empresas, usuarios y contactos temporales y los borran al terminar. Lo único que **no** se borra es el consumo de IA en `ai_usage`: probar cuesta plata de verdad y el panel de consumo no debe mentir.
