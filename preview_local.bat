@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:8765/"
  py -m http.server 8765
  exit /b %errorlevel%
)
where python >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:8765/"
  python -m http.server 8765
  exit /b %errorlevel%
)
echo Python not found. Install Python or open index.html in your browser.
pause
exit /b 1
