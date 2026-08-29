# Pruebas

Dos carpetas, porque responden preguntas distintas.

| Carpeta | La pregunta |
|---|---|
| `seguridad/` | ¿puede alguien ver o hacer algo que no debe? |
| `calidad/` | ¿funciona, y se ve como tiene que verse? |

```
node pruebas/todo.cjs             las de siempre (~2 min)
node pruebas/todo.cjs --con-ia    también las de conversación (~$0.10)
node pruebas/todo.cjs seguridad   solo una carpeta
```

Seguridad va primero a propósito: si algo se está filtrando, da igual que la
pantalla se vea bonita.

## seguridad/

| | Qué comprueba |
|---|---|
| `aislamiento-rls` | ninguna tabla entrega datos sin sesión |
| `aislamiento-entre-clientes` | un cliente autenticado solo ve lo suyo |
| `auditoria-bd` | RLS, vistas, `SECURITY DEFINER`, y qué alcanza de verdad la llave pública |
| `auditoria-registro-abierto` | qué alcanza alguien que se registra solo |
| `auditoria-secretos` | el sitio publicado, el repo, el historial y el candado del pre-commit |
| `auditoria-n8n` | qué webhooks comprueban quién llama |
| `canario-entre-agentes` | que un agente no suelte datos de otro cliente |

**Los permisos no se leen, se intentan.** La primera versión de `auditoria-bd`
listaba los `GRANT` y daba 33 hallazgos graves; los 33 eran falsos, porque
Supabase concede permisos amplios a `anon` a propósito y deja que RLS decida.
Mirar el `GRANT` dice quién tiene la llave; solo intentar entrar dice si la
puerta abre.

## calidad/

| | Qué comprueba |
|---|---|
| `compila-jsx` | que el sitio no se despliegue roto |
| `nada-de-un-cliente` | que ninguna pantalla compartida hable de un solo sector |
| `consola-agentes` · `consola-catalogo` · `consola-alta` | la consola de administración |
| `cliente-contactos` · `cliente-campos` | lo que el cliente puede hacer con su base |
| `correr-pruebas` | los 18 escenarios de conversación (cuesta plata) |
| `calidad-conversacion` | el tono y la calidad de las respuestas (cuesta plata) |

Los escenarios se leen con `node calidad/correr-pruebas.cjs --ver`: en los de
inyección, «no contiene la palabra prohibida» no es lo mismo que «se portó
bien», y eso solo lo juzga alguien leyéndolo.

## El candado del pre-commit

`.githooks/buscar-secretos.cjs` impide commitear algo que parezca un secreto.
Se activa una vez por máquina:

```
git config core.hooksPath .githooks
```

`auditoria-secretos` comprueba que esté puesto: un candado que nadie instaló no
protege nada.
