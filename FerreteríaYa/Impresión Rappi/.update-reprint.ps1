$p = 'd:\Ferney Rojas\Proyectos\ToqueFlow\FerreteríaYa\Impresión Rappi\rappi-print-workflow.json'
$j = [System.IO.File]::ReadAllText($p, [System.Text.UTF8Encoding]::new($false))

# Step 1: items en Sheets con precio
$q = [char]39
$oldS = '($(' + $q + 'Parsear JSON' + $q + ').item.json.items || []).map(it => it.qty + ' + $q + 'x ' + $q + ' + it.name).join(' + $q + '; ' + $q + ')'
$newS = '($(' + $q + 'Parsear JSON' + $q + ').item.json.items || []).map(it => it.qty + ' + $q + 'x ' + $q + ' + it.name + ' + $q + ' $' + $q + ' + Number(it.price).toLocaleString(' + $q + 'es-CO' + $q + ')).join(' + $q + '; ' + $q + ')'

if ($j.Contains($oldS)) {
  $j = $j.Replace($oldS, $newS)
  Write-Output 'Step 1 OK'
} else {
  Write-Output 'Step 1 FAIL'
}

[System.IO.File]::WriteAllText($p, $j, [System.Text.UTF8Encoding]::new($false))
