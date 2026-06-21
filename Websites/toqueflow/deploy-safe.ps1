<#
  deploy-safe.ps1 - Deploy SEGURO de toqueflow.com: respaldo + verificacion + auto-rollback.

  Por que existe: hosting_deployStaticWebsite sube un zip que reemplaza/actualiza TODO el
  docroot (no una sola URL). Un deploy parcial o un fallo intermitente de Hostinger puede
  vaciar el sitio entero (incidente 2026-06-20). Este script SIEMPRE despliega el sitio
  COMPLETO, guarda snapshots fechados y revierte solo si la verificacion falla.

  Uso:
    powershell -File deploy-safe.ps1 -SeedLastGood   # crea backups/last-good-site.zip desde site/ (sitio actual sano)
    powershell -File deploy-safe.ps1                 # build completo -> deploy -> verifica -> rollback si falla
#>
param(
  [string]$Domain = "toqueflow.com",
  [switch]$SeedLastGood
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$site    = Join-Path $root "site"
$backups = Join-Path $root "backups"
if (-not (Test-Path $backups)) { New-Item -ItemType Directory -Path $backups | Out-Null }
$lastGood = Join-Path $backups "last-good-site.zip"
$stamp    = Get-Date -Format "yyyyMMdd-HHmmss"

# Archivos a EXCLUIR del deploy (junk + media pesada no usada por el sitio vivo)
function Should-Exclude($rel) {
  if ($rel -match '^(node_modules|dist|supabase)/') { return $true }
  if ($rel -eq '.thumbnail' -or $rel -eq 'STYLEGUIDE.md') { return $true }
  if ($rel -eq 'assets/responsive.css' -or $rel -eq 'assets/mobile-menu.js') { return $true }
  # media pesada original directamente bajo assets/ (NO bajo assets/img/, que si se usa)
  if ($rel -match '^assets/[^/]+\.(mov|jpg|jpeg)$') { return $true }
  return $false
}

# Construye el zip del sitio COMPLETO (barras forward)
function Build-SiteZip($outZip) {
  if (Test-Path $outZip) { [System.IO.File]::Delete($outZip) }
  $fs = [System.IO.File]::Open($outZip, [System.IO.FileMode]::Create)
  $ar = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
  $n = 0
  Get-ChildItem -Path $site -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($site.Length + 1) -replace '\\','/'
    if (Should-Exclude $rel) { return }
    $entry = $ar.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $es = $entry.Open(); $b = [System.IO.File]::ReadAllBytes($_.FullName); $es.Write($b,0,$b.Length); $es.Close()
    $n++
  }
  $ar.Dispose(); $fs.Close()
  return $n
}

# Verifica que las URLs clave respondan 200 (con reintentos para esperar la propagacion)
function Test-Live {
  $urls = @(
    'index.html','dashboard.html','admin.html','login.html','nosotros.html',
    'rappi-bogota.html','sm-grand/ocupacion.html','assets/toqueflow-logo.png','assets/img/cyborg-statue.jpg'
  )
  for ($try = 1; $try -le 20; $try++) {
    $allOk = $true; $codes = @()
    foreach ($u in $urls) {
      $code = -1
      try { $code = (Invoke-WebRequest -Uri "https://$Domain/$u" -Method Head -TimeoutSec 12 -UseBasicParsing).StatusCode }
      catch { if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } }
      $codes += "$u=$code"
      if ($code -ne 200) { $allOk = $false }
    }
    Write-Host ("  verify {0,2}: {1}" -f $try, ($codes -join '  '))
    if ($allOk) { return $true }
    Start-Sleep -Seconds 8
  }
  return $false
}

function Deploy-Zip($zip) {
  Write-Host "-> Desplegando $zip ..."
  & node (Join-Path $root "mcp-deploy.cjs") $Domain $zip
  if ($LASTEXITCODE -ne 0) { throw "mcp-deploy.cjs salio con codigo $LASTEXITCODE" }
}

# =====================================================================
$buildZip = Join-Path $backups "$stamp-site.zip"
$count = Build-SiteZip $buildZip
$sizeMB = [math]::Round((Get-Item $buildZip).Length/1MB, 2)
Write-Host "Construido: $buildZip  ($count archivos, $sizeMB MB)"

if ($SeedLastGood) {
  Copy-Item $buildZip $lastGood -Force
  Write-Host "[OK] Sembrado backups/last-good-site.zip (restauracion del sitio actual). No se desplego nada."
  return
}

# Deploy normal con verificacion + rollback
Deploy-Zip $buildZip
Write-Host "Verificando el sitio en vivo..."
if (Test-Live) {
  Copy-Item $buildZip $lastGood -Force
  Write-Host "[DEPLOY OK] todas las URLs en 200. last-good actualizado."
} else {
  Write-Host "[FALLO] alguna URL no responde 200."
  if (Test-Path $lastGood) {
    Write-Host "[ROLLBACK] redeployando el ultimo bueno ($lastGood)..."
    Deploy-Zip $lastGood
    if (Test-Live) { Write-Host "[ROLLBACK OK] sitio restaurado al ultimo bueno." }
    else { Write-Host "[ROLLBACK FALLO] revisar Hostinger manualmente. Snapshot del intento: $buildZip" }
  } else {
    Write-Host "[SIN ROLLBACK] no hay last-good-site.zip. Corre primero: deploy-safe.ps1 -SeedLastGood"
  }
  exit 1
}
