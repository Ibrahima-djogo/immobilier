@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "PROJECT=%CD%"
set "SOURCE=%~dp0package\src"
set "OWNER_TARGET=%PROJECT%\src\app\(dashboard)\proprietaire"
set "COMPONENT_TARGET=%PROJECT%\src\components\proprietaire"
set "LIB_TARGET=%PROJECT%\src\lib\proprietaire"
set "BACKUP=%PROJECT%\backup-proprietaire"

echo.
echo ==========================================================
echo INSTALLATION DE L'ESPACE PROPRIETAIRE
echo ==========================================================
echo.

if not exist "%PROJECT%\package.json" goto not_project
if not exist "%SOURCE%\app\(dashboard)\proprietaire" goto missing_source

if exist "%BACKUP%" rmdir /s /q "%BACKUP%"
md "%BACKUP%"

if exist "%OWNER_TARGET%" xcopy "%OWNER_TARGET%" "%BACKUP%\app-proprietaire\" /e /i /y >nul
if exist "%COMPONENT_TARGET%" xcopy "%COMPONENT_TARGET%" "%BACKUP%\components-proprietaire\" /e /i /y >nul
if exist "%LIB_TARGET%" xcopy "%LIB_TARGET%" "%BACKUP%\lib-proprietaire\" /e /i /y >nul

xcopy "%SOURCE%\app\(dashboard)\proprietaire" "%OWNER_TARGET%\" /e /i /y
if errorlevel 1 goto copy_error

xcopy "%SOURCE%\components\proprietaire" "%COMPONENT_TARGET%\" /e /i /y
if errorlevel 1 goto copy_error

xcopy "%SOURCE%\lib\proprietaire" "%LIB_TARGET%\" /e /i /y
if errorlevel 1 goto copy_error

echo.
echo ==========================================================
echo INSTALLATION TERMINEE
echo Sauvegarde : %BACKUP%
echo ==========================================================
echo.
echo Lancez ensuite :
echo npm install lucide-react
echo npm run dev
echo.
pause
exit /b 0

:not_project
echo ERREUR : package.json est introuvable.
echo Placez ce fichier a la racine du projet immobilier.
pause
exit /b 1

:missing_source
echo ERREUR : le dossier package est introuvable.
echo Ne deplacez pas install-proprietaire.cmd hors du pack decompresse.
pause
exit /b 1

:copy_error
echo ERREUR pendant la copie des fichiers.
echo Verifiez les droits du dossier et recommencez.
pause
exit /b 1
