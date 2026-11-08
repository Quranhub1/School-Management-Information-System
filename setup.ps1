[CmdletBinding()]
param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot

function Require-Command([string]$Name, [string]$InstallHint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is required but was not found. $InstallHint"
    }
}

Write-Host "SMIS dependency setup" -ForegroundColor Cyan
Write-Host "Repository: $repoRoot"

if (-not $SkipFrontend) {
    Require-Command "node" "Install Node.js 24 LTS, then reopen PowerShell."
    Require-Command "npm" "Install npm (included with Node.js 24 LTS), then reopen PowerShell."

    $nodeVersion = (& node -p "process.versions.node").Trim()
    $nodeMajor = [int]($nodeVersion.Split('.')[0])
    if ($nodeMajor -lt 24) {
        throw "Node.js 24 or newer is required; found $nodeVersion. Install Node.js 24 LTS."
    }

    Push-Location (Join-Path $repoRoot "frontend")
    try {
        Write-Host "Installing exact frontend dependencies from package-lock.json (npm ci)..." -ForegroundColor Yellow
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE." }
    }
    finally { Pop-Location }
}

if (-not $SkipBackend) {
    Require-Command "dotnet" "Install the .NET 8 SDK, then reopen PowerShell."
    $sdkVersion = (& dotnet --version).Trim()
    $sdkMajor = [int]($sdkVersion.Split('.')[0])
    if ($sdkMajor -lt 8) {
        throw ".NET 8 SDK or newer is required; found $sdkVersion."
    }

    Push-Location (Join-Path $repoRoot "backend")
    try {
        Write-Host "Restoring all .NET solution dependencies..." -ForegroundColor Yellow
        dotnet restore "SchoolManagement.sln"
        if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed with exit code $LASTEXITCODE." }
    }
    finally { Pop-Location }
}

Write-Host "SMIS dependency setup completed." -ForegroundColor Green
Write-Host "Next: run 'cd frontend; npm run build' and 'cd backend; dotnet build SchoolManagement.sln'."
