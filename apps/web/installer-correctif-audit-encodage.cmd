@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "PROJECT=%CD%"
set "SOURCE=%PROJECT%\package\tools"
set "AUDIT_TARGET=%PROJECT%\tools\audit-frontend.mjs"
set "SHELL_TARGET=%PROJECT%\src\components\public\InstitutionalShell.tsx"
set "BACKUP=%PROJECT%\backup-correctif-audit-encodage"

echo.
echo ==========================================================
echo CORRECTIF AUDIT ET ENCODAGE
echo ==========================================================
echo.

if not exist "%PROJECT%\package.json" goto not_project
if not exist "%SOURCE%\audit-frontend.mjs" goto missing_source
if not exist "%SOURCE%\repair-mojibake.ps1" goto missing_source

echo [1/5] Sauvegarde des fichiers actuels...
if exist "%BACKUP%" rmdir /s /q "%BACKUP%"
md "%BACKUP%"

if exist "%AUDIT_TARGET%" (
  copy /Y "%AUDIT_TARGET%" "%BACKUP%\audit-frontend.mjs" >nul
)

if exist "%SHELL_TARGET%" (
  copy /Y "%SHELL_TARGET%" "%BACKUP%\InstitutionalShell.tsx" >nul
)

echo [2/5] Installation de l'audit compatible avec l'alias @/...
if not exist "%PROJECT%\tools" md "%PROJECT%\tools"
copy /Y "%SOURCE%\audit-frontend.mjs" "%AUDIT_TARGET%" >nul
if errorlevel 1 goto copy_error

echo [3/5] Reparation de l'encodage du composant public...
powershell -NoProfile -ExecutionPolicy Bypass -File ^
"%SOURCE%\repair-mojibake.ps1" ^
-FilePath "%SHELL_TARGET%"

if errorlevel 1 goto repair_error

echo [4/5] Suppression du cache Next.js...
if exist "%PROJECT%\.next" (
  rmdir /s /q "%PROJECT%\.next"
  echo Cache .next supprime.
) else (
  echo Aucun cache .next present.
)

echo [5/5] Nouvel audit...
echo.
node "%AUDIT_TARGET%"

set "AUDIT_RESULT=%ERRORLEVEL%"

echo.
echo ==========================================================
if "%AUDIT_RESULT%"=="0" (
  echo CORRECTION TERMINEE SANS ERREUR D'AUDIT
) else (
  echo CORRECTION TERMINEE - AUTRES ERREURS A EXAMINER
)
echo ==========================================================
echo.
echo Sauvegarde :
echo %BACKUP%
echo.
echo Relancez ensuite :
echo npm run dev
echo.
pause
exit /b %AUDIT_RESULT%

:not_project
echo ERREUR : package.json introuvable.
echo Placez ce pack a la racine du projet immobilier.
pause
exit /b 1

:missing_source
echo ERREUR : le dossier package du correctif est incomplet.
pause
exit /b 1

:copy_error
echo ERREUR pendant la copie de l'outil d'audit.
pause
exit /b 1

:repair_error
echo ERREUR pendant la reparation de l'encodage.
pause
exit /b 1
