@echo off
setlocal
cd /d "%~dp0"

if not exist "create-demeure-pages.ps1" (
    echo [ERREUR] Le fichier create-demeure-pages.ps1 est introuvable.
    echo Placez les deux fichiers dans le meme dossier que package.json.
    pause
    exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-demeure-pages.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo [ERREUR] La creation a echoue avec le code %EXIT_CODE%.
    pause
    exit /b %EXIT_CODE%
)

echo.
pause
exit /b 0
