@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PROJECT=%CD%"
set "SOURCE=%~dp0package\src"
set "APP_TARGET=%PROJECT%\src\app\(dashboard)\agence"
set "COMP_TARGET=%PROJECT%\src\components\agence"
set "LIB_TARGET=%PROJECT%\src\lib\agence"
set "BACKUP=%PROJECT%\backup-agence"

echo.
echo ==========================================================
echo INSTALLATION DE L'ESPACE AGENCE
echo ==========================================================
echo.

if not exist "%PROJECT%\package.json" goto not_project
if not exist "%SOURCE%\app\(dashboard)\agence" goto missing_source

if exist "%BACKUP%" rmdir /s /q "%BACKUP%"
md "%BACKUP%"

if exist "%APP_TARGET%" xcopy "%APP_TARGET%" "%BACKUP%\app-agence\" /e /i /y >nul
if exist "%COMP_TARGET%" xcopy "%COMP_TARGET%" "%BACKUP%\components-agence\" /e /i /y >nul
if exist "%LIB_TARGET%" xcopy "%LIB_TARGET%" "%BACKUP%\lib-agence\" /e /i /y >nul

xcopy "%SOURCE%\app\(dashboard)\agence" "%APP_TARGET%\" /e /i /y
if errorlevel 1 goto copy_error
xcopy "%SOURCE%\components\agence" "%COMP_TARGET%\" /e /i /y
if errorlevel 1 goto copy_error
xcopy "%SOURCE%\lib\agence" "%LIB_TARGET%\" /e /i /y
if errorlevel 1 goto copy_error

echo.
echo INSTALLATION TERMINEE
echo Sauvegarde : %BACKUP%
echo.
echo Lancez ensuite :
echo npm install lucide-react
echo npm run dev
echo.
pause
exit /b 0

:not_project
echo ERREUR : package.json introuvable.
pause
exit /b 1

:missing_source
echo ERREUR : dossier package introuvable.
pause
exit /b 1

:copy_error
echo ERREUR pendant la copie.
pause
exit /b 1
