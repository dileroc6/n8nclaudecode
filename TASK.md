# Tareas — el conjunto de trabajo

> **Generado.** No se edita a mano: sale de [`ToqueFlow/TABLERO.md`](ToqueFlow/TABLERO.md),
> que es la única lista de verdad. Para regenerarlo:
>
> ```
> node ToqueFlow/render-task.cjs
> ```
>
> Existe para abrir una sesión sin leerse el tablero entero. Si algo de aquí
> contradice al tablero, **manda el tablero** y hay que regenerar.

Al 2026-09-25: **61 tareas abiertas.**

---

## 🚨 Urgente — decide si lo demás puede esperar

| # | Qué | Quién |
|---|---|---|
| **26** | 🔴 FerreteríaYa y Savia NO se pueden migrar todavía — y ya se sabe por qué<br><sub>✅ LuxeSmile y Zoe hechos.</sub> | Diego |
| **57** | 🚨 El WhatsApp de FerreteríaYa lleva 18 días caído — ya se sabe exactamente por qué<br><sub>Diagnosticado el 13-sep, cadena completa: sus 4 instancias de Evolution están en `connecting`, no en `open`.</sub> | Diego |
| **60** | 🚨 La función de Vassco NO está caída: está abierta a internet<br><sub>El tablero decía lo contrario en las dos direcciones.</sub> | Diego |
| **62** | 🔴 Encender WhatsApp en Bejauha — falta UNA cosa, y no es la que parecía<br><sub>Al preparar el go-live apareció que el escalamiento no llega a nadie: sus reglas dicen a dónde avisar en PALABRAS —«equipo de Bejauha», «administración»— y el flujo manda ese texto como si f</sub> | Diego |
| **159** | 🚨 Los avisos del agente de Bejauha no le llegan a nadie<br><sub>Cuando el agente no sabe algo deja de contestar y avisa a una persona.</sub> | Diego |
| **165** | 🚨 Rotar el secreto del receptor de eventos<br><sub>Lleva público desde agosto.</sub> | Diego + Claude |
| **177** | 🚨 Dos contraseñas de portal del repo público SEGUÍAN ABRIENDO SESIÓN<br><sub>Encontrado el 24-sep endureciendo el buscador de secretos.</sub> | Diego + Claude |

## 🤖 Lo que puede hacer Claude solo

Por aquí arranca una sesión cuando no hay nada urgente.

| # | Qué | |
|---|---|---|
| **59** | Resembrar `last-good-site.zip` cuando el logo vuelva<br><sub>El punto de restauración actual no tiene imágenes</sub> | Claude |
| **108** | 🟡 Lo nuevo tiene pruebas: queda solo (c), y está bloqueado<br><sub>✅ (a) cerrado el 30-ago con `agente-agenda.cjs` — encontró justo lo que existía para encontrar: el agente decía «tu cita está agendada» y no había ninguna cita.</sub> | Claude |
| **144** | 🟡 Un token de instancia de Evolution vale como llave global<br><sub>Investigado el 10-sep, y el hallazgo no era el que yo creía.</sub> | Claude |

## 👤 Esperando a una persona

No proponer estas como trabajo: no avanzan sin que alguien haga algo fuera del repo.

| # | Qué | Quién |
|---|---|---|
| **1** | Propuesta con precio y fecha a SM Grand Hotel — es el más caliente, está en negociación | Ferney |
| **2** | Recotizar Zoe a $1.200.000 + $600.000/mes — le pasaste $5.5M y nunca supiste si ese fue el freno | Ferney |
| **3** | Propuesta con precio y fecha a Savia y LuxeSmile | Ferney |
| **4** | Revisar el extracto: ¿Vassco está pagando? Cinco minutos. No se puede planear sin saber cuánto factura el negocio | Cualquiera |
| **6** | 🔑 Crear una llave de Anthropic propia de ToqueFlow | Diego |
| **11** | Pasar los números exactos de Claude Max y del VPS | Diego |
| **12** | Pedir dos referidos a Bejauha | Ferney |
| **15** | Armar la lista del segmento | Ferney |
| **16** | Cronometrar el próximo cliente, hora por hora | Diego |
| **21** | El logo de Bejauha | Diego |
| **23** | Normalizar los teléfonos guardados | Diego |
| **32** | Correr el banco de pruebas antes de cada cambio del agente | Diego |
| **35** | Que la cita también aparezca en el Google Calendar del negocio | Diego |
| **58** | El logo y el favicon dan 404 en producción | Diego |
| **61** | Plan de respaldo del VPS de Evolution | Diego |
| **65** | Protocolo de cambios del flujo compartido | Diego |
| **67** | Tomar un snapshot manual del VPS | Diego |
| **68** | Escribir el documento de recuperación | Diego |
| **69** | Probar la restauración una vez | Diego |
| **73** | Decidir qué se hace con los datos de Metabase | Confirmar antes de borrar nada |
| **96** | Limpiar el historial de git | Diego |
| **99** | Instalar Python | Diego |
| **103** | 🟡 Webhooks abiertos: de 28 a 14, y la puerta principal cerrada | Diego decide 25 y 26 |
| **109** | Cambiar las dos contraseñas temporales | Diego |
| **112** | Decidir qué se hace con `ing.diegolrc@gmail.com` | Diego |
| **113** | Pasar el repositorio de GitHub a privado | Diego |
| **114** | Dar acceso del repo a Ferney | Diego |
| **118** | 🟡 Los secretos de n8n: de 22 a 3, y queda LO IMPORTANTE | Diego |
| **136** | Firmar `wa-router` — NO se puede todavía | Diego |
| **146** | `POSTGRES_PASSWORD=evolution123` | Diego |
| **149** | 📏 Cuánto cuesta migrar un cliente viejo: el primer número | Diego |
| **152** | FerreteríaYa: son 4 instancias pero solo 2 hacen falta | Diego |
| **156** | 🟡 Savia: 2 de sus 10 piezas de conocimiento nunca se confirmaron | Diego |
| **157** | El primer sincronizador de catálogo | Diego |
| **164** | No hay marca blanca | Diego |
| **170** | 🟡 Los flujos de Bejauha siguen en `gpt-4o` | Diego |

## 🤔 Decisiones abiertas

| # | Qué |
|---|---|
| **10** | ¿Pueden facturar formalmente ya? Si SM Grand dice que sí la otra semana, tienen que poder emitir factura. Un "podríamos manejarlo" se vuelve un freno en el peor momento |
| **13** | Fijar el precio y no moverlo |
| **14** | Definir el techo de una demo gratis |
| **75** | Definir el umbral de upgrade antes de que duela |
| **76** | Cotizar el KVM 2 y meterlo en el margen |
| **78** | Revisar los límites de concurrencia antes del cliente cinco |
| **79** | Decidir el plan de partición si un VPS no alcanza |
| **87** | Revisar si el Postgres del VPS sigue haciendo falta |
| **88** | Ajustar la configuración de Postgres para un VPS de 4 GB |
| **115** | Gestor de contraseñas compartido |
| **138** | El trato de FerreteríaYa ya tiene número: $300.000/mes |
| **139** | Toque Mide y Toque Escribe siguen sin precio |
| **154** | Lo que Camila NO tiene que configurar |
| **162** | 🌍 Los datos de pacientes están en Ohio |
| **163** | WhatsApp corre sobre Evolution, no sobre la API oficial |

---

_El detalle de cada fila —por qué existe, qué se probó, qué se decidió— está en_
_[`ToqueFlow/TABLERO.md`](ToqueFlow/TABLERO.md). Aquí solo está el titular._
