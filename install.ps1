#!/usr/bin/env pwsh

$ErrorActionPreference = 'Stop'

if ($v) {
  $Version = "v${v}"
}

if ($Args.Length -eq 1) {
  $Version = $Args.Get(0)
}

$CRONXInstall = $env:CRONX_INSTALL
$BinDir = if ($CRONXInstall) {
  "${CRONXInstall}\bin"
} else {
  "${Home}\.cronx\bin"
}

$CRONXTarGz = "$BinDir\cronx.tar.gz"
$CRONXExe = "$BinDir\cronx.exe"

$DownloadUrl = if (!$Version) {
  "https://github.com/polyseam/cronx/releases/latest/download/cronx-win-amd64.tar.gz"
} else {
  "https://github.com/polyseam/cronx/releases/download/${Version}/cronx-win-amd64.tar.gz"
}

if (!(Test-Path $BinDir)) {
  New-Item $BinDir -ItemType Directory | Out-Null
}

curl.exe --fail --location --progress-bar --output $CRONXTarGz $DownloadUrl

tar.exe --extract --file $CRONXTarGz -C $BinDir

Remove-Item $CRONXTarGz

$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
  [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
  $Env:Path += ";${BinDir}"
}

& $CRONXExe '--help'

Write-Output "cronx was installed successfully to ${CRONXExe}"
Write-Output "Stuck? Join our Discord https://cronx.run/di?utm_id=5095"
