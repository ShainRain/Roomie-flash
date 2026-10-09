@echo off
rem Sync real audio: copy the web demo mp3 into the mini program package assets.
rem All paths are relative to this script, safe after project migration.
rem Run once before demo (double-click). Player prefers /assets/audio/aruarian-dance.mp3.
set "ROOT=%~dp0.."
set "SRC=%ROOT%\preview-app\public\audio\aruarian-dance.mp3"
if not exist "%ROOT%\miniprogram\assets\audio" mkdir "%ROOT%\miniprogram\assets\audio"
if not exist "%SRC%" (
  echo [sync-audio] source not found: %SRC%
  exit /b 1
)
copy /y "%SRC%" "%ROOT%\miniprogram\assets\audio\aruarian-dance.mp3" >nul
if errorlevel 1 ( echo [sync-audio] copy failed & exit /b 1 )
echo [sync-audio] OK -^> miniprogram\assets\audio\aruarian-dance.mp3
