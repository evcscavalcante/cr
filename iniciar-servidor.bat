@echo off
cd /d "%~dp0\docs"
start http://localhost:8000
npx http-server . -p 8000 -c-1
pause
