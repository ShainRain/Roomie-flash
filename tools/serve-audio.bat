@echo off
rem Fallback for real audio: serve a staging dir at http://127.0.0.1:8787
rem so the mini program player.js candidate #2 (original filename URL) works.
rem Keep this window running. Staging dir .audio-serve/ is a temp copy (gitignored).
set "ROOT=%~dp0.."
set "SRC=%ROOT%\preview-app\public\audio\aruarian-dance.mp3"
where python >nul 2>nul
if errorlevel 1 ( echo [serve-audio] python not found & exit /b 1 )
if not exist "%SRC%" ( echo [serve-audio] source not found: %SRC% & exit /b 1 )
if not exist "%ROOT%\.audio-serve" mkdir "%ROOT%\.audio-serve"
copy /y "%SRC%" "%ROOT%\.audio-serve\Nujabes - Aruarian Dance.mp3" >nul
echo [serve-audio] serving %ROOT%\.audio-serve at http://127.0.0.1:8787 ...
python -m http.server 8787 --directory "%ROOT%\.audio-serve"
