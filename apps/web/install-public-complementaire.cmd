@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "PROJECT=%CD%"
set "SOURCE=%PROJECT%\package\src"
set "PUBLIC_SOURCE=%SOURCE%\app\(public)"
set "PUBLIC_TARGET=%PROJECT%\src\app\(public)"
set "COMP_SOURCE=%SOURCE%\components\public"
set "COMP_TARGET=%PROJECT%\src\components\public"
set "LIB_SOURCE=%SOURCE%\lib\public"
set "LIB_TARGET=%PROJECT%\src\lib\public"
set "BACKUP=%PROJECT%\backup-public-complementaire"

echo.
echo ==========================================================
echo INSTALLATION DES PAGES PUBLIQUES COMPLEMENTAIRES
echo ==========================================================
echo.

if not exist "%PROJECT%\package.json" goto not_project
if not exist "%PUBLIC_SOURCE%\agences\page.tsx" goto missing_source

if exist "%BACKUP%" rmdir /s /q "%BACKUP%"
md "%BACKUP%"

echo [1/5] Sauvegarde des fichiers publics existants...
if exist "%PUBLIC_TARGET%" (
    robocopy "%PUBLIC_TARGET%" "%BACKUP%\app-public" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
)
if exist "%COMP_TARGET%" (
    robocopy "%COMP_TARGET%" "%BACKUP%\components-public" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
)
if exist "%LIB_TARGET%" (
    robocopy "%LIB_TARGET%" "%BACKUP%\lib-public" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
)

echo [2/5] Copie recursive des routes publiques...
robocopy "%PUBLIC_SOURCE%" "%PUBLIC_TARGET%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo [3/5] Copie des composants partages...
robocopy "%COMP_SOURCE%" "%COMP_TARGET%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo [4/5] Copie des donnees de demonstration...
robocopy "%LIB_SOURCE%" "%LIB_TARGET%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo.
echo Verification des routes...
call :checkRoute "agences"
call :checkRoute "agences\[slug]"
call :checkRoute "a-propos"
call :checkRoute "contact"
call :checkRoute "faq"
call :checkRoute "guides"
call :checkRoute "guides\[slug]"
call :checkRoute "conditions-utilisation"
call :checkRoute "confidentialite"
call :checkRoute "cookies"
call :checkRoute "charte-publication"
call :checkRoute "signaler"
call :checkRoute "procedure-signalement"
call :checkRoute "plan-du-site"

echo.
echo [5/5] Suppression du cache Next.js...
if exist "%PROJECT%\.next" (
    rmdir /s /q "%PROJECT%\.next"
    echo Cache .next supprime.
) else (
    echo Aucun cache .next present.
)

echo.
echo ==========================================================
echo INSTALLATION TERMINEE
echo Sauvegarde : %BACKUP%
echo ==========================================================
echo.
echo Lancez maintenant :
echo npm install lucide-react
echo npm run dev
echo.
echo Testez :
echo http://localhost:3000/agences
echo http://localhost:3000/a-propos
echo http://localhost:3000/contact
echo.
pause
exit /b 0

:checkRoute
if exist "%PUBLIC_TARGET%\%~1\page.tsx" (
    echo [OK] /%~1
) else (
    echo [MANQUANT] /%~1
)
exit /b 0

:not_project
echo ERREUR : package.json est introuvable.
echo Placez le pack a la racine du projet immobilier.
pause
exit /b 1

:missing_source
echo ERREUR : le dossier package est incomplet.
echo Ne deplacez pas le fichier CMD hors du pack decompresse.
pause
exit /b 1

:copy_error
echo ERREUR pendant la copie avec robocopy.
echo Verifiez les droits Windows et fermez les fichiers verrouilles.
pause
exit /b 1
