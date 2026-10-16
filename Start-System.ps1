# Start the SMIS backend and frontend from one PowerShell command.
# Run from any directory: .\Start-System.ps1
$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$BackendProject = Join-Path $RepoRoot 'backend\src\SchoolManagement.Api\SchoolManagement.Api.csproj'
$FrontendRoot = Join-Path $RepoRoot 'frontend'

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) { throw 'The .NET SDK is not installed or dotnet is not on PATH.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js/npm is not installed or npm is not on PATH.' }
if (-not (Test-Path -LiteralPath $BackendProject)) { throw "Backend project was not found: $BackendProject" }
if (-not (Test-Path -LiteralPath (Join-Path $FrontendRoot 'package.json'))) { throw "Frontend package.json was not found: $FrontendRoot" }
if (-not (Test-Path -LiteralPath (Join-Path $FrontendRoot 'node_modules'))) { throw "Frontend dependencies are missing. Run 'npm install' in '$FrontendRoot' first." }

function Test-LocalPortListening([int]$Port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try { $task = $client.ConnectAsync('127.0.0.1', $Port); return $task.Wait(500) -and $client.Connected }
    catch { return $false }
    finally { $client.Dispose() }
}

if ((Test-LocalPortListening 5000) -or (Test-LocalPortListening 5173)) {
    Write-Host 'One or both SMIS ports are already in use:' -ForegroundColor Yellow
    Write-Host '  Backend:  http://127.0.0.1:5000'
    Write-Host '  Frontend: http://localhost:5173 or http://127.0.0.1:5173'
    Write-Host 'Stop the existing SMIS process(es), then run this script again.'
    exit 1
}

# Base64-encode child commands to handle paths containing spaces safely.
$escapedRoot = $RepoRoot.Replace("'", "''")
$backendCommand = @(
    '$Host.UI.RawUI.WindowTitle = ''SMIS Backend''',
    "Set-Location -LiteralPath '$escapedRoot'",
    '$env:ASPNETCORE_ENVIRONMENT = ''Development''',
    '$env:ASPNETCORE_URLS = ''http://127.0.0.1:5000''',
    "dotnet run --project '.\backend\src\SchoolManagement.Api\SchoolManagement.Api.csproj'"
) -join "`n"
$frontendCommand = @(
    '$Host.UI.RawUI.WindowTitle = ''SMIS Frontend''',
    "Set-Location -LiteralPath '$escapedRoot\frontend'",
    'npm run dev -- --host 0.0.0.0'
) -join "`n"
$encode = { param([string]$Command) [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command)) }

Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', (& $encode $backendCommand))
Start-Sleep -Seconds 2
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', (& $encode $frontendCommand))

Write-Host ''
Write-Host 'SMIS startup commands launched in two PowerShell windows.' -ForegroundColor Green
Write-Host 'Frontend: http://localhost:5173 or http://127.0.0.1:5173'
Write-Host 'Backend:  http://127.0.0.1:5000'
Write-Host 'Keep both windows open. PostgreSQL must be running and its connection settings must be configured.'
