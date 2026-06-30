import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = r'd:\Ferney Rojas\Proyectos\ToqueFlow\FerreteríaYa\Impresión Rappi\rappi-print-workflow.json'
with open(path, 'r', encoding='utf-8') as f:
    j = f.read()

old = (
    "El siguiente texto fue copiado de una página de pedidos de Rappi.\\n"
    "Contiene información irrelevante (nombre del repartidor, texto de botones, etiquetas de sección, etc.).\\n"
    "Extrae SOLO estos datos y devuelve un JSON con esta estructura exacta:"
)

new = (
    "El siguiente texto puede tener DOS formatos:\\n\\n"
    "FORMATO A (Rappi nuevo): texto copiado de una página de pedidos de Rappi. Contiene ruido (nombre del repartidor, texto de botones, etiquetas de sección, etc.).\\n\\n"
    "FORMATO B (Reimpresión): UNA SOLA línea de texto con campos separados por TABS, en este orden EXACTO:\\n"
    "FECHA_HORA[TAB]ID_ORDEN[TAB]REF[TAB]CLIENTE[TAB]CEDULA[TAB]ITEMS[TAB]SUBTOTAL[TAB]DESCUENTO[TAB]TOTAL\\n"
    "donde ITEMS es una cadena con uno o varios items en formato \\\"qty x nombre $precio; qty x nombre $precio; ...\\\". El $precio puede no aparecer en filas viejas — si no aparece, distribuye el subtotal proporcionalmente entre los items.\\n\\n"
    "Detecta automáticamente el formato y extrae los datos. Devuelve un JSON con esta estructura exacta:"
)

assert old in j, "old prompt not found"
j = j.replace(old, new)

# Add rule for format B in the rules section
old_rules = "- Si un campo no aparece, usa null\\n- Responde SOLO con el JSON, sin explicaciones ni markdown"
new_rules = "- Si un campo no aparece, usa null\\n- Para FORMATO B: los campos vienen separados por TABs; parsea ITEMS dividiendo por punto y coma (;) y cada item por 'x' (qty x name) y opcionalmente '$' para el precio\\n- Responde SOLO con el JSON, sin explicaciones ni markdown"

assert old_rules in j, "old rules not found"
j = j.replace(old_rules, new_rules)

with open(path, 'w', encoding='utf-8') as f:
    f.write(j)

print("OK: prompt actualizado")
