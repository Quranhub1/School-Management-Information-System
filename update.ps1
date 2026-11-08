[CmdletBinding()]
param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is required. Install Git for Windows and reopen PowerShell."
}

Push-Location $repoRoot
try {
    $changes = git status --porcelain
    if ($LASTEXITCODE -ne 0) { throw "Unable to inspect Git working tree." }
    if ($changes) {
        throw "Working tree has local changes. Commit or stash them before updating; no files were changed."
    }

    Write-Host "Fast-forwarding the current branch from its configured upstream..." -ForegroundColor Cyan
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw "git pull failed. Resolve the Git/network issue, then retry." }

    $setupArgs = @()
    if ($SkipFrontend) { $setupArgs += "-SkipFrontend" }
    if ($SkipBackend) { $setupArgs += "-SkipBackend" }
    & (Join-Path $repoRoot "setup.ps1") @setupArgs
    if ($LASTEXITCODE -ne 0) { throw "Dependency setup failed." }
}
finally { Pop-Location }
