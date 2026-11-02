$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = 'http://127.0.0.1:3000/'
$healthUrl = 'http://127.0.0.1:3000/api/auth/session'

function Test-NovomaticService {
  try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
    $payload = $response.Content | ConvertFrom-Json
    return ($null -ne $payload.authenticated -and -not [string]::IsNullOrWhiteSpace([string]$payload.csrfToken))
  } catch {
    return $false
  }
}

try {
  if (-not (Test-Path -LiteralPath (Join-Path $projectPath '.env'))) {
    throw 'Falta .env. Copia .env.example a .env y completa las claves y credenciales siguiendo README.md.'
  }
  if (-not (Test-Path -LiteralPath (Join-Path $projectPath 'node_modules'))) {
    throw 'Faltan las dependencias. Abre PowerShell en esta carpeta y ejecuta npm ci.'
  }
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  $nodeMajor = [int](& $node -p "Number(process.versions.node.split('.')[0])")
  if ($nodeMajor -lt 20) {
    throw 'Se requiere Node.js 20 o superior.'
  }
  $storagePath = Join-Path $projectPath 'storage'
  if (-not (Test-Path -LiteralPath $storagePath)) {
    New-Item -ItemType Directory -Path $storagePath -Force | Out-Null
  }

  if (-not (Test-NovomaticService)) {
    $listener = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
      throw 'El puerto 3000 está ocupado por otro servicio. Cerralo y volvé a ejecutar NOVOMATIC ARG.'
    }
    $logStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $stdout = Join-Path $storagePath "launcher-$logStamp.log"
    $stderr = Join-Path $storagePath "launcher-$logStamp-error.log"
    Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr | Out-Null
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
      Start-Sleep -Seconds 1
      if (Test-NovomaticService) { $ready = $true; break }
    }
    if (-not $ready) {
      $details = ''
      if (Test-Path -LiteralPath $stderr) { $details = (Get-Content -LiteralPath $stderr -Tail 12 -ErrorAction SilentlyContinue) -join "`n" }
      if ([string]::IsNullOrWhiteSpace($details)) { $details = 'El servicio no respondió en 60 segundos.' }
      Add-Type -AssemblyName PresentationFramework
      [System.Windows.MessageBox]::Show($details, 'NOVOMATIC ARG', 'OK', 'Error') | Out-Null
      exit 1
    }
  }
  Start-Process -FilePath $url
} catch {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($_.Exception.Message, 'NOVOMATIC ARG', 'OK', 'Error') | Out-Null
  exit 1
}
