$p = 'd:\Ferney Rojas\Proyectos\ToqueFlow\FerreteríaYa\Impresión Rappi\rappi-print-workflow.json'
$j = [System.IO.File]::ReadAllText($p, [System.Text.UTF8Encoding]::new($false))

# 1. Cambiar label del boton del form
$j = $j.Replace('"buttonLabel": "GENERAR RECIBO"', '"buttonLabel": "IMPRIMIR"')

# 2. Reemplazar boton de imprimir por auto-print script
$apos = [char]39
$oldBody = '<button class=\"print-btn no-print\" onclick=\"window.print()\">IMPRIMIR RECIBO</button>\n  <a href=\"/form/rappi-print\" class=\"new-order-btn no-print\">NUEVA ORDEN</a>\n</body>'
$newBody = '<a href=\"/form/rappi-print\" class=\"new-order-btn no-print\">NUEVA ORDEN</a>\n  <script>window.addEventListener(' + $apos + 'load' + $apos + ', () => setTimeout(() => window.print(), 200));</script>\n</body>'

if ($j.Contains($oldBody)) {
  $j = $j.Replace($oldBody, $newBody)
  [System.IO.File]::WriteAllText($p, $j, [System.Text.UTF8Encoding]::new($false))
  Write-Output 'OK: cambios aplicados'
} else {
  Write-Output 'ERROR: bloque no encontrado'
}
