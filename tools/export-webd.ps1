$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$exportRoot = Join-Path $workspaceRoot 'export'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$baseName = "groomerhouse-webd-node-$stamp"
$packageRoot = Join-Path $exportRoot $baseName
$zipPath = Join-Path $exportRoot "$baseName.zip"

if ((Test-Path -LiteralPath $packageRoot) -or (Test-Path -LiteralPath $zipPath)) {
  throw "Package target already exists: $baseName"
}

Push-Location $workspaceRoot
try {
  npm audit --audit-level=low
  if ($LASTEXITCODE -ne 0) { throw 'Dependency audit failed. Package was not created.' }

  npm run build:webd
  if ($LASTEXITCODE -ne 0) { throw 'Webd build failed.' }

  node (Join-Path $PSScriptRoot 'package-webd.mjs') $packageRoot
  if ($LASTEXITCODE -ne 0) { throw 'Webd package staging failed.' }

  Push-Location $packageRoot
  try {
    npm install --package-lock-only --omit=dev --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Webd runtime lockfile generation failed.' }
    npm audit --omit=dev --audit-level=low
    if ($LASTEXITCODE -ne 0) { throw 'Webd runtime dependency audit failed. ZIP was not created.' }
  }
  finally { Pop-Location }

  Compress-Archive -Path (Join-Path $packageRoot '*') -DestinationPath $zipPath -CompressionLevel Optimal
  Write-Output "Package: $zipPath"
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  $zipStream = [System.IO.File]::OpenRead($zipPath)
  try {
    $hash = [System.BitConverter]::ToString($sha256.ComputeHash($zipStream)).Replace('-', '')
    Write-Output "SHA-256: $hash"
  }
  finally {
    $zipStream.Dispose()
    $sha256.Dispose()
  }
}
finally { Pop-Location }
