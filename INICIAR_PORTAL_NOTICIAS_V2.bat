@echo off
chcp 65001 > nul
title AURUM NEWS V2 — Portal de Noticias Gold Editorial (Puerto 3001)
color 0E

echo ===============================================================================
echo     ✨ AURUM NEWS V2 — THE GOLD STANDARD IN GLOBAL JOURNALISM ✨
echo        (Bookmarks + Zoom Tipografico + TTS con Velocidad + Telemetria)
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando entorno Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    set "PATH=C:\nvm4w\nodejs;C:\Program Files\nodejs;%PATH%"
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Node.js en el sistema.
    echo Por favor instale Node.js o verifique la ruta C:\nvm4w\nodejs.
    pause
    exit /b 1
)

echo [2/3] Verificando dependencias en node_modules...
if not exist "node_modules\" (
    echo Instalando paquetes de produccion (express, dotenv)...
    call npm install --no-audit --no-fund
)

echo [3/3] Iniciando servidor V2 en http://localhost:3001...
echo.
echo Presione CTRL+C para detener el servidor.
echo Abriendo navegador en 3 segundos...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3001"
node server.js

pause
