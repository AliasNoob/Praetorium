[CmdletBinding()]
param(
  [int]$BackendPort = 5005,
  [int]$FrontendPort = 3000,
  [switch]$Detach
)

Set-StrictMode -Version Latest

function Get-RepoRoot {
  $root = Resolve-Path (Join-Path $PSScriptRoot '..')
  return $root.Path
}

function Get-CommandLineForPid {
  param([int]$ProcessId)
  try {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId"
    return $proc.CommandLine
  } catch {
    return $null
  }
}

function Get-RepoDevProcessIds {
  param([string]$RepoRoot)

  $rootRegex = [regex]::Escape($RepoRoot)

  $patterns = @(
    'server\.js',
    'react-scripts',
    'webpack(-dev-server)?',
    'concurrently',
    'nodemon',
    'npm run dev\b',
    'npm run dev-server\b',
    'npm run dev-client\b'
  )

  $patternRegex = ($patterns -join '|')

  $matching = @()
  foreach ($proc in (Get-CimInstance Win32_Process | Where-Object { $_.CommandLine })) {
    if ($proc.CommandLine -match $rootRegex -and $proc.CommandLine -match $patternRegex) {
      $matching += [int]$proc.ProcessId
    }
  }

  return $matching | Sort-Object -Unique
}

function Get-RepoProcessIdsListeningOnPort {
  param(
    [string]$RepoRoot,
    [int]$Port
  )

  $rootRegex = [regex]::Escape($RepoRoot)
  $pids = @()

  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
      $processId = [int]$conn.OwningProcess
      if ($processId -le 0) { continue }

      $cmd = Get-CommandLineForPid -ProcessId $processId
      if ($cmd -and $cmd -match $rootRegex) {
        $pids += $processId
      }
    }
  } catch {
    # Ignore failures (e.g. older PS / limited permissions)
  }

  return $pids | Sort-Object -Unique
}

function Stop-ProcessTree {
  param([int]$ProcessId)

  if ($ProcessId -le 0 -or $ProcessId -eq $PID) { return }

  $name = $null
  try { $name = (Get-Process -Id $ProcessId -ErrorAction Stop).ProcessName } catch {}

  if ($name) {
    Write-Host "Stopping $name (PID $ProcessId)..."
  } else {
    Write-Host "Stopping PID $ProcessId..."
  }

  try {
    & taskkill /PID $ProcessId /F /T 2>$null | Out-Null
  } catch {
    try {
      Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    } catch {}
  }
}

function Wait-ForPortsToClose {
  param(
    [string]$RepoRoot,
    [int[]]$Ports,
    [int]$TimeoutSeconds = 10
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $open = @()
    foreach ($p in $Ports) {
      $repoListeningPids = @(Get-RepoProcessIdsListeningOnPort -RepoRoot $RepoRoot -Port $p)
      if ($repoListeningPids.Count -gt 0) { $open += $p }
    }

    if ($open.Count -eq 0) { return }
    Start-Sleep -Milliseconds 250
  }
}

$repoRoot = Get-RepoRoot
Set-Location $repoRoot

Write-Host "Repo: $repoRoot"

$pids = @()
$pids += Get-RepoDevProcessIds -RepoRoot $repoRoot
$pids += Get-RepoProcessIdsListeningOnPort -RepoRoot $repoRoot -Port $BackendPort
$pids += Get-RepoProcessIdsListeningOnPort -RepoRoot $repoRoot -Port $FrontendPort
$pids = @($pids | Sort-Object -Unique)

if ($pids.Count -eq 0) {
  Write-Host "No matching frontend/backend dev processes found."
} else {
  foreach ($processId in $pids) {
    Stop-ProcessTree -ProcessId $processId
  }
}

Wait-ForPortsToClose -RepoRoot $repoRoot -Ports @($BackendPort, $FrontendPort) -TimeoutSeconds 10

if ($Detach) {
  Write-Host "Starting backend and frontend in new windows..."
  $escapedRepoRoot = $repoRoot.Replace("'", "''")

  Start-Process -FilePath "powershell" -WorkingDirectory $repoRoot -ArgumentList @(
    "-NoProfile",
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$escapedRepoRoot'; npm run dev-server"
  ) | Out-Null

  Start-Process -FilePath "powershell" -WorkingDirectory $repoRoot -ArgumentList @(
    "-NoProfile",
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath '$escapedRepoRoot'; npm run dev-client"
  ) | Out-Null

  Write-Host "Done."
  exit 0
}

Write-Host "Starting dev (backend + frontend)..."
& npm run dev
