import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = r'd:\Ferney Rojas\Proyectos\ToqueFlow\FerreteríaYa\Impresión Rappi\rappi-print-workflow.json'
with open(path, 'r', encoding='utf-8') as f:
    j = f.read()

# 1) Modificar Parsear JSON: agregar deteccion de tipo
old = "let pedido;\\ntry {\\n  pedido = JSON.parse(clean);\\n} catch (e) {\\n  throw new Error('Claude no devolvió un JSON válido: ' + raw);\\n}\\n\\nreturn [{ json: pedido }];"

new = (
    "let pedido;\\ntry {\\n  pedido = JSON.parse(clean);\\n} catch (e) {\\n  throw new Error('Claude no devolvió un JSON válido: ' + raw);\\n}\\n\\n"
    "const inputText = $('Form Trigger').item.json.pedido_rappi || '';\\n"
    "const looksLikeSheet = /\\\\t/.test(inputText) && /^\\\\d{1,2}\\\\/\\\\d{1,2}\\\\/\\\\d{2,4}/.test(inputText.trim());\\n"
    "pedido.tipo = looksLikeSheet ? 'REIMPRESION' : 'NUEVO';\\n\\n"
    "return [{ json: pedido }];"
)

assert old in j, "old jsCode not found"
j = j.replace(old, new)
print("Step 1 OK: tipo detection added")

# 2) Agregar columna TIPO al nodo Sheets - en el "value" map
old_val = '"TOTAL": "={{ $(\'Parsear JSON\').item.json.total }}"'
new_val = '"TOTAL": "={{ $(\'Parsear JSON\').item.json.total }}",\n            "TIPO": "={{ $(\'Parsear JSON\').item.json.tipo }}"'

assert old_val in j, "TOTAL value not found"
j = j.replace(old_val, new_val)
print("Step 2 OK: TIPO value added")

# 3) Agregar TIPO al schema del nodo Sheets
old_schema = '{"id":"TOTAL","displayName":"TOTAL","type":"string","canBeUsedToMatch":true,"required":false,"display":true}'
new_schema = '{"id":"TOTAL","displayName":"TOTAL","type":"string","canBeUsedToMatch":true,"required":false,"display":true},\n            {"id":"TIPO","displayName":"TIPO","type":"string","canBeUsedToMatch":true,"required":false,"display":true}'

assert old_schema in j, "TOTAL schema not found"
j = j.replace(old_schema, new_schema)
print("Step 3 OK: TIPO schema added")

with open(path, 'w', encoding='utf-8') as f:
    f.write(j)

print("Workflow actualizado")
