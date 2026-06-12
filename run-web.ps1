$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\mobile"

Write-Host "Starting Clinic Flow Web App..." -ForegroundColor Cyan

# Offline mode skips dependency validation (avoids "fetch failed" and speeds up bundling)
$env:EXPO_OFFLINE = 'true'

npx expo start --web
