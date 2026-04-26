$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot


$faceDir = Join-Path $repoRoot "face-api"
$ocrDir = Join-Path $repoRoot "ocr-api"
$chatDir = Join-Path $repoRoot "chat-api"

$facePython = Join-Path $faceDir "venv\\Scripts\\python.exe"
$ocrPython = Join-Path $ocrDir "venv\\Scripts\\python.exe"
$chatPython = Join-Path $chatDir "venv\\Scripts\\python.exe"

function Assert-FileExists($path, $hint) {
  if (-not (Test-Path $path)) {
    throw "Missing: $path`nHint: $hint"
  }
}

function Invoke-NativeQuiet($exe, $arguments) {
  $previousErrorActionPreference = $ErrorActionPreference
  $hasNativePreference = Test-Path variable:PSNativeCommandUseErrorActionPreference
  if ($hasNativePreference) {
    $previousNativePreference = $PSNativeCommandUseErrorActionPreference
  }

  try {
    $ErrorActionPreference = "Continue"
    if ($hasNativePreference) {
      $PSNativeCommandUseErrorActionPreference = $false
    }
    & $exe @arguments 1>$null 2>$null
    return $LASTEXITCODE
  } catch {
    return 1
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
    if ($hasNativePreference) {
      $PSNativeCommandUseErrorActionPreference = $previousNativePreference
    }
  }
}

function Invoke-NativeChecked($exe, $arguments, $failureMessage) {
  $previousErrorActionPreference = $ErrorActionPreference
  $hasNativePreference = Test-Path variable:PSNativeCommandUseErrorActionPreference
  if ($hasNativePreference) {
    $previousNativePreference = $PSNativeCommandUseErrorActionPreference
  }

  try {
    $ErrorActionPreference = "Continue"
    if ($hasNativePreference) {
      $PSNativeCommandUseErrorActionPreference = $false
    }
    & $exe @arguments | Out-Host
    if ($LASTEXITCODE -ne 0) {
      throw $failureMessage
    }
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
    if ($hasNativePreference) {
      $PSNativeCommandUseErrorActionPreference = $previousNativePreference
    }
  }
}

function Test-PythonCommand($pythonExe, $code) {
  return ((Invoke-NativeQuiet $pythonExe @("-c", $code)) -eq 0)
}

function Get-BootstrapPythonCommand() {
  $candidates = @()

  if (Get-Command py -ErrorAction SilentlyContinue) {
    $candidates += ,@("py", "-3.11")
    $candidates += ,@("py", "-3.10")
    $candidates += ,@("py", "-3.9")
    $candidates += ,@("py", "-3")
    $candidates += ,@("py")
  }

  $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
  if ($pythonCmd) {
    $candidates += ,@($pythonCmd.Source)
  }

  foreach ($candidate in $candidates) {
    $exe = $candidate[0]
    $args = @($candidate | Select-Object -Skip 1)
    $exitCode = Invoke-NativeQuiet $exe ($args + @("-c", "import sys"))
    if ($exitCode -eq 0) {
      return $candidate
    }
  }

  throw "Missing: a usable Python installation. Install Python 3.11 if possible, or any supported Python 3.x so `py -0p` or `python --version` works."
}

function Ensure-Venv($name, $dir) {
  $pythonExe = Join-Path $dir "venv\\Scripts\\python.exe"
  $needsInstall = $false
  if (Test-Path $pythonExe) {
    if ($name -eq "face-api" -or $name -eq "ocr-api") {
      if ($name -eq "ocr-api") {
        $probeOk = Test-PythonCommand $pythonExe "import fastapi, uvicorn, numpy, cv2, PIL, rapidfuzz, transformers, torch"
      } else {
        $probeOk = Test-PythonCommand $pythonExe "import fastapi, uvicorn, numpy, cv2"
      }
    } elseif ($name -eq "chat-api") {
      $probeOk = Test-PythonCommand $pythonExe "import fastapi, uvicorn, httpx"
    } else {
      $probeOk = Test-PythonCommand $pythonExe "import sys"
    }

    if (-not $probeOk) {
      $needsInstall = $true
    }
    if (-not $needsInstall) { return $pythonExe }
    Write-Host "$name venv exists but dependencies look missing/broken. Re-installing requirements..."
  }

  $bootstrapPython = Get-BootstrapPythonCommand

  Push-Location $dir
  try {
    if ($needsInstall -and (Test-Path "venv")) {
      $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
      Rename-Item -Path "venv" -NewName ("venv_old_" + $stamp) -ErrorAction SilentlyContinue
    }
    if (-not (Test-Path "venv\\Scripts\\python.exe")) {
      Write-Host "Creating $name venv ..."
      Invoke-NativeChecked $bootstrapPython[0] (@($bootstrapPython | Select-Object -Skip 1) + @("-m", "venv", "venv")) "Failed to create the $name virtual environment."
    }
    Invoke-NativeChecked ".\\venv\\Scripts\\python.exe" @("-m", "pip", "install", "--upgrade", "pip") "Failed to upgrade pip for $name."
    Invoke-NativeChecked ".\\venv\\Scripts\\python.exe" @("-m", "pip", "install", "-r", "requirements.txt") "Failed to install requirements for $name."
  } finally {
    Pop-Location
  }

  if (-not (Test-Path $pythonExe)) {
    throw "Failed to create venv for $name at $pythonExe. If you see Permission denied, run .\\scripts\\stop-dev.cmd and try again."
  }
  return $pythonExe
}

function Get-ListenerPid($port) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $listener) { return $null }
  return $listener.OwningProcess
}

function Get-ProcInfo($procId) {
  try {
    return Get-CimInstance Win32_Process -Filter "ProcessId=$procId" | Select-Object -Property Name,CommandLine,ProcessId
  } catch {
    return $null
  }
}

function LooksLikeOurService($name, $procInfo) {
  if ($null -eq $procInfo) { return $false }
  $pname = $procInfo.Name
  $cmd = $procInfo.CommandLine
  if ($null -eq $cmd) { $cmd = "" }
  if ($name -eq "face-api") {
    return ($pname -ieq "python.exe") -and ($cmd -match "face-api" -or $cmd -match "uvicorn" -or $cmd -match "main\\.py")
  }
  if ($name -eq "ocr-api") {
    return ($pname -ieq "python.exe") -and ($cmd -match "ocr-api" -or $cmd -match "uvicorn" -or $cmd -match "main\\.py")
  }
  if ($name -eq "chat-api") {
    return ($pname -ieq "python.exe") -and ($cmd -match "chat-api" -or $cmd -match "uvicorn" -or $cmd -match "main\\.py")
  }
  return $false
}

function Is-Healthy($url) {
  try {
    $resp = Invoke-RestMethod -Method Get -Uri $url -TimeoutSec 2
    return ($resp -and $resp.status -eq "healthy")
  } catch {
    return $false
  }
}

function Ensure-Service($port, $name, $pythonExe, $workDir, $healthUrl, $timeoutSeconds) {
  $listenerPid = Get-ListenerPid $port
  if ($null -ne $listenerPid) {
    if (Is-Healthy $healthUrl) {
      Write-Host "$name already running on port $port (PID $listenerPid). Reusing it."
      return $null
    }
    $info = Get-ProcInfo $listenerPid
    if (LooksLikeOurService $name $info) {
      Write-Host "Port $port is in use by a stale $name process (PID $listenerPid). Stopping it..."
      Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 500
      $listenerPid = Get-ListenerPid $port
      if ($null -ne $listenerPid) {
        throw "Port $port is still in use after stopping PID $($info.ProcessId). Stop the other process first (PID $listenerPid)."
      }
    } else {
      throw "Port $port is already in use (needed for $name). Stop the other process first (PID $listenerPid)."
    }
  }

  $logDir = Join-Path $repoRoot "logs"
  if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  $outLog = Join-Path $logDir ($name + ".out.log")
  $errLog = Join-Path $logDir ($name + ".err.log")
  $proc = Start-Process -FilePath $pythonExe -ArgumentList "-u", "main.py" -WorkingDirectory $workDir -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Is-Healthy $healthUrl) { return $proc }
    Start-Sleep -Milliseconds 400
  }
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
  throw "$name failed to become healthy at $healthUrl (PID $($proc.Id)). Check logs: $outLog and $errLog"
}


$facePython = Ensure-Venv "face-api" $faceDir
$ocrPython = Ensure-Venv "ocr-api" $ocrDir
$chatPython = Ensure-Venv "chat-api" $chatDir


$faceProc = Ensure-Service 8000 "face-api" $facePython $faceDir "http://127.0.0.1:8000/health" 90
$ocrProc = Ensure-Service 8001 "ocr-api" $ocrPython $ocrDir "http://127.0.0.1:8001/health" 45
$chatProc = Ensure-Service 8002 "chat-api" $chatPython $chatDir "http://127.0.0.1:8002/health" 20

Write-Output "face-api  : http://127.0.0.1:8000"
Write-Output "ocr-api   : http://127.0.0.1:8001"
Write-Output "chat-api  : http://127.0.0.1:8002"
Write-Output "health    : http://127.0.0.1:8000/health and http://127.0.0.1:8001/health and http://127.0.0.1:8002/health"
Write-Output ""
Write-Output "Stop later with:"
Write-Output "  .\\scripts\\stop-dev.cmd"
