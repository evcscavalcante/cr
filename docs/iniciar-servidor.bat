@echo off
cd /d "%~dp0\src"
start http://localhost:8000
python -m http.server 8000
pause
