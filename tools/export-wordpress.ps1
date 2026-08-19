$ErrorActionPreference = 'Stop'

$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$exportRoot = Join-Path $workspace 'export\groomerhouse-wordpress-sftp'
$zipPath = Join-Path $workspace 'export\groomerhouse-wordpress-sftp.zip'

node (Join-Path $PSScriptRoot 'prepare-wordpress-package.mjs')

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $exportRoot '*') -DestinationPath $zipPath -CompressionLevel Optimal
$stream = [System.IO.File]::OpenRead($zipPath)
try {
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hashBytes = $sha256.ComputeHash($stream)
        $hash = ([System.BitConverter]::ToString($hashBytes)).Replace('-', '')
    }
    finally {
        $sha256.Dispose()
    }
}
finally {
    $stream.Dispose()
}
$size = (Get-Item -LiteralPath $zipPath).Length

[pscustomobject]@{
    Package = $zipPath
    Bytes = $size
    SHA256 = $hash
} | Format-List
