import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = r'd:\Ferney Rojas\Proyectos\ToqueFlow\FerreteríaYa\Impresión Rappi\rappi-print-workflow.json'
with open(path, 'r', encoding='utf-8') as f:
    j = f.read()

# 1) Mostrar boton visible en printing-screen (con texto Imprimiendo + boton Volver)
old1 = r'<div class=\"printing-screen\"></div>'
new1 = r'<div class=\"printing-screen\"><div class=\"printing-text\">Imprimiendo...</div><a href=\"/form/rappi-print\" class=\"manual-back\">VOLVER AL FORMULARIO</a></div>'
assert old1 in j, "div printing-screen vacio no encontrado"
j = j.replace(old1, new1)
print("Step 1 OK")

# 2) Reducir timeout fallback de 10s a 3s
old2 = "setTimeout(()=>{window.location.href='/form/rappi-print';},10000);"
new2 = "setTimeout(()=>{window.location.href='/form/rappi-print';},3000);"
assert old2 in j, "timeout 10000 no encontrado"
j = j.replace(old2, new2)
print("Step 2 OK")

# 3) Agregar mediaquery listener para mejor deteccion
old3 = "window.onafterprint=()=>{window.location.href='/form/rappi-print';};setTimeout(()=>window.print(),50);"
new3 = ("var redir=()=>{window.location.href='/form/rappi-print';};"
        "window.onafterprint=redir;"
        "if(window.matchMedia){var mql=window.matchMedia('print');mql.addEventListener&&mql.addEventListener('change',e=>{if(!e.matches)redir();});}"
        "setTimeout(()=>window.print(),50);")
assert old3 in j, "script onafterprint no encontrado"
j = j.replace(old3, new3)
print("Step 3 OK")

with open(path, 'w', encoding='utf-8') as f:
    f.write(j)
print("OK")
