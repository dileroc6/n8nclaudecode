import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = r'd:\Ferney Rojas\Proyectos\ToqueFlow\FerreteríaYa\Impresión Rappi\rappi-print-workflow.json'
with open(path, 'r', encoding='utf-8') as f:
    j = f.read()

# Reemplazar el bloque printing-screen con estilos inline (sin position fixed)
old1 = r'<div class=\"printing-screen\"><div class=\"printing-text\">Imprimiendo...</div><a href=\"/form/rappi-print\" class=\"manual-back\">VOLVER AL FORMULARIO</a></div>'
new1 = (
    r'<div class=\"printing-screen\" '
    r'style=\"text-align:center; padding:40px 20px; min-height:200px;\">'
    r'<div style=\"font-size:22px; font-weight:700; letter-spacing:5px; text-transform:uppercase; color:#ffb800; margin-bottom:32px;\">Imprimiendo...</div>'
    r'<a href=\"/form/rappi-print\" '
    r'style=\"display:inline-block; padding:14px 32px; background:#ffb800; color:#0a0a0f; font-weight:800; text-decoration:none; border-radius:10px; letter-spacing:2px; text-transform:uppercase; font-size:13px;\">'
    r'VOLVER AL FORMULARIO</a></div>'
)
assert old1 in j, "div printing-screen no encontrado"
j = j.replace(old1, new1)
print("Step 1 OK: estilos inline aplicados")

with open(path, 'w', encoding='utf-8') as f:
    f.write(j)
