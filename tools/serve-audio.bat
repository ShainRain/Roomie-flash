@echo off
rem Fallback for real audio: serve the project root at http://127.0.0.1:8787
rem so player.js can fetch the sibling mp3 over HTTP. Keep this window running.
set "ROOT=%~dp0.."
where python >nul 2>nul
if errorlevel 1 ( echo [serve-audio] python not found & exit /b 1 )
echo [serve-audio] serving %ROOT% at http://127.0.0.1:8787 ...
python -m http.server 8787 --directory "%ROOT%"
