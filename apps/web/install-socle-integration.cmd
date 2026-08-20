@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PROJECT=%CD%"
set "SOURCE=%PROJECT%\package"
set "BACKUP=%PROJECT%\backup-socle-integration"

echo.
echo ==========================================================
echo INSTALLATION DU SOCLE INTEGRATION FRONT-END
echo ==========================================================
echo.

if not exist "%PROJECT%\package.json" goto not_project
if not exist "%SOURCE%\src\lib\api\http-client.ts" goto missing_source

echo [1/6] Sauvegarde des fichiers existants...
if exist "%BACKUP%" rmdir /s /q "%BACKUP%"
md "%BACKUP%"

if exist "%PROJECT%\src\lib\api" robocopy "%PROJECT%\src\lib\api" "%BACKUP%\src\lib\api" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
if exist "%PROJECT%\src\lib\auth" robocopy "%PROJECT%\src\lib\auth" "%BACKUP%\src\lib\auth" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
if exist "%PROJECT%\src\lib\config" robocopy "%PROJECT%\src\lib\config" "%BACKUP%\src\lib\config" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
if exist "%PROJECT%\src\lib\routes" robocopy "%PROJECT%\src\lib\routes" "%BACKUP%\src\lib\routes" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
if exist "%PROJECT%\src\components\system" robocopy "%PROJECT%\src\components\system" "%BACKUP%\src\components\system" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul

for %%F in (not-found.tsx loading.tsx error.tsx global-error.tsx system-pages.module.css robots.ts sitemap.ts) do (
  if exist "%PROJECT%\src\app\%%F" copy /Y "%PROJECT%\src\app\%%F" "%BACKUP%\%%F" >nul
)

echo [2/6] Copie des bibliotheques...
robocopy "%SOURCE%\src\lib" "%PROJECT%\src\lib" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo [3/6] Copie des composants systeme...
robocopy "%SOURCE%\src\components\system" "%PROJECT%\src\components\system" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo [4/6] Copie des pages globales et techniques...
robocopy "%SOURCE%\src\app" "%PROJECT%\src\app" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

copy /Y "%SOURCE%\src\middleware.example.ts" "%PROJECT%\src\middleware.example.ts" >nul

echo [5/6] Copie des outils et documents...
robocopy "%SOURCE%\tools" "%PROJECT%\tools" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error
robocopy "%SOURCE%\docs" "%PROJECT%\docs" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

if not exist "%PROJECT%\.env.local.example" copy /Y "%~dp0.env.local.example" "%PROJECT%\.env.local.example" >nul

echo [6/6] Suppression du cache Next.js...
if exist "%PROJECT%\.next" rmdir /s /q "%PROJECT%\.next"

echo.
echo Verification rapide...
if exist "%PROJECT%\src\app\not-found.tsx" echo [OK] Page 404 globale
if exist "%PROJECT%\src\app\error.tsx" echo [OK] Page erreur globale
if exist "%PROJECT%\src\app\robots.ts" echo [OK] robots.txt dynamique
if exist "%PROJECT%\src\app\sitemap.ts" echo [OK] sitemap.xml dynamique
if exist "%PROJECT%\tools\audit-frontend.mjs" echo [OK] Outil d'audit
if exist "%PROJECT%\src\middleware.example.ts" echo [OK] Middleware exemple non actif

echo.
echo ==========================================================
echo INSTALLATION TERMINEE
echo ==========================================================
echo.
echo Sauvegarde :
echo %BACKUP%
echo.
echo Lancez :
echo node tools\audit-frontend.mjs
echo npm run dev
echo.
pause
exit /b 0

:not_project
echo ERREUR : package.json introuvable.
pause
exit /b 1

:missing_source
echo ERREUR : le dossier package du socle est incomplet.
pause
exit /b 1

:copy_error
echo ERREUR pendant la copie avec robocopy.
pause
exit /b 1
