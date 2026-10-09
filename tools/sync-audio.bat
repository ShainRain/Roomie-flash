@echo off
rem Sync real audio: copy the mp3 (sibling of miniprogram/) into the package assets.
rem All paths are relative to this script, safe after project migration.
rem Run once before demo (double-click). Player prefers /assets/audio/aruarian-dance.mp3.
set "ROOT=%~dp0.."
if not exist "%ROOT%\miniprogram\assets\audio" mkdir "%ROOT%\miniprogram\assets\audio"
if not exist "%ROOT%\Nujabes - Aruarian Dance.mp3" (
  echo [sync-audio] source not found: %ROOT%\Nujabes - Aruarian Dance.mp3
  exit /b 1
)
copy /y "%ROOT%\Nujabes - Aruarian Dance.mp3" "%ROOT%\miniprogram\assets\audio\aruarian-dance.mp3" >nul
if errorlevel 1 ( echo [sync-audio] copy failed & exit /b 1 )
echo [sync-audio] OK -^> miniprogram\assets\audio\aruarian-dance.mp3
