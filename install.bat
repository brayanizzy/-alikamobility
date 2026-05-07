@echo off
setlocal

set "NODEEXE=C:\Program Files\nodejs\node.exe"
set "NPMCLI=C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"
set "PROJDIR=c:\Users\Brayan\Documents\ALIKA MOBILITY"

cd /d "%PROJDIR%"

echo === Version de Node ===
"%NODEEXE%" --version

echo.
echo === npm install ===
"%NODEEXE%" "%NPMCLI%" install

echo.
echo === Verification ===
if exist "%PROJDIR%\node_modules" (
    echo SUCCES: node_modules cree
) else (
    echo ECHEC: node_modules absent
)
