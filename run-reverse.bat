@echo off
title ClinicFlow USB Port Forwarder
echo ==============================================
echo   ClinicFlow USB Port Forwarding Helper
echo ==============================================
echo.
echo Setting up port 8080 forwarding from phone to computer...
adb reverse tcp:8080 tcp:8080
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Port 8080 forwarded successfully!
    echo You can now use "127.0.0.1:8080/api" in the Server Settings.
) else (
    echo.
    echo [ERROR] Failed to set up forwarding.
    echo Please make sure:
    echo 1. Your phone is connected via USB.
    echo 2. "USB Debugging" is enabled in Developer Options on your phone.
)
echo.
echo ==============================================
pause
