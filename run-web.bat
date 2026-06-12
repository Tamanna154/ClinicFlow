@echo off
cd /d "%~dp0mobile"
echo Starting Clinic Flow Web App...
echo.
REM Offline mode skips dependency validation (avoids "fetch failed" and speeds up bundling)
set EXPO_OFFLINE=true
npx expo start --web
