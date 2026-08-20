@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "PROJECT=%CD%"
set "SOURCE=%PROJECT%\package\src"
set "APP_SOURCE=%SOURCE%\app\(admin)\administration"
set "APP_TARGET=%PROJECT%\src\app\(admin)\administration"
set "COMP_SOURCE=%SOURCE%\components\administration"
set "COMP_TARGET=%PROJECT%\src\components\administration"
set "LIB_SOURCE=%SOURCE%\lib\administration"
set "LIB_TARGET=%PROJECT%\src\lib\administration"

echo.
echo ==========================================================
echo REPARATION DES ROUTES ADMINISTRATION
echo ==========================================================
echo.

if not exist "%PROJECT%\package.json" goto not_project
if not exist "%APP_SOURCE%\page.tsx" goto missing_source

echo [1/5] Arret conseille du serveur Next.js...
echo Si npm run dev tourne encore, revenez dans sa fenetre et faites CTRL+C.
echo.

echo [2/5] Copie recursive des pages Administration...
robocopy "%APP_SOURCE%" "%APP_TARGET%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo [3/5] Copie des composants partages...
robocopy "%COMP_SOURCE%" "%COMP_TARGET%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo [4/5] Copie des donnees de demonstration...
robocopy "%LIB_SOURCE%" "%LIB_TARGET%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo.
echo Verification des routes essentielles...
call :checkRoute "utilisateurs"
call :checkRoute "demandes-role"
call :checkRoute "annonces"
call :checkRoute "moderation"
call :checkRoute "signalements"
call :checkRoute "referentiels"
call :checkRoute "statistiques"
call :checkRoute "audit"
call :checkRoute "contenus"
call :checkRoute "parametres"
call :checkRoute "administrateurs"

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
echo REPARATION TERMINEE
echo ==========================================================
echo.
echo Lancez maintenant :
echo npm run dev
echo.
echo Puis ouvrez :
echo http://localhost:3000/administration/utilisateurs
echo.
pause
exit /b 0

:checkRoute
if exist "%APP_TARGET%\%~1\page.tsx" (
    echo [OK] /administration/%~1
) else (
    echo [MANQUANT] /administration/%~1
)
exit /b 0

:not_project
echo ERREUR : package.json est introuvable.
echo Placez ce script a la racine du projet immobilier.
pause
exit /b 1

:missing_source
echo ERREUR : les fichiers sources du pack sont introuvables.
echo Verifiez que le dossier package est encore present a la racine.
pause
exit /b 1

:copy_error
echo ERREUR : robocopy n'a pas pu copier les fichiers.
echo Verifiez les droits Windows et fermez VS Code si un fichier est verrouille.
pause
exit /b 1
