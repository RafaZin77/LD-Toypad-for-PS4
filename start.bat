@echo off
cd /d "%~dp0"
echo LEGO Dimensions Toy Pad - painel PS4 ^| criado por RafaZin77
if not exist node_modules call npm install --omit=dev
node server.js
pause
