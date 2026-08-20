@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "PROJECT=%CD%"
set "SOURCE=%PROJECT%\package\src\app\(public)"
set "TARGET=%PROJECT%\src\app\(public)"
set "BACKUP=%PROJECT%\backup-rollback-guide-aide"

echo.
echo ==========================================================
echo ROLLBACK GUIDE D'UTILISATION ET CENTRE D'AIDE
echo ==========================================================
echo.

if not exist "%PROJECT%\package.json" goto not_project
if not exist "%SOURCE%\aide\page.tsx" goto missing_source
if not exist "%SOURCE%\aide\page.module.css" goto missing_source

echo [1/6] Sauvegarde des versions actuelles...
if exist "%BACKUP%" rmdir /s /q "%BACKUP%"
md "%BACKUP%"

if exist "%TARGET%\aide" (
    robocopy "%TARGET%\aide" "%BACKUP%\aide" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
)

if exist "%TARGET%\guides" (
    robocopy "%TARGET%\guides" "%BACKUP%\guides" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
)

echo [2/6] Restauration exacte de la page d'hier...
if not exist "%TARGET%\aide" md "%TARGET%\aide"
copy /Y "%SOURCE%\aide\page.tsx" "%TARGET%\aide\page.tsx" >nul
if errorlevel 1 goto copy_error
copy /Y "%SOURCE%\aide\page.module.css" "%TARGET%\aide\page.module.css" >nul
if errorlevel 1 goto copy_error

echo [3/6] Suppression du contenu concurrent de /guides...
if exist "%TARGET%\guides" rmdir /s /q "%TARGET%\guides"

echo [4/6] Creation des redirections vers /aide...
robocopy "%SOURCE%\guides" "%TARGET%\guides" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto copy_error

echo [5/6] Correction des liens publics connus...
if exist "%PROJECT%\src\components\public\InstitutionalShell.tsx" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p='%PROJECT%\src\components\public\InstitutionalShell.tsx';" ^
    "$c=Get-Content -LiteralPath $p -Raw;" ^
    "$c=$c.Replace('href=\"/guides\"','href=\"/aide\"');" ^
    "$c=$c.Replace('>Guides</Link>','>Guide d''utilisation</Link>');" ^
    "Set-Content -LiteralPath $p -Value $c -Encoding utf8"
)

if exist "%PROJECT%\src\app\(public)\plan-du-site\page.tsx" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p='%PROJECT%\src\app\(public)\plan-du-site\page.tsx';" ^
    "$c=Get-Content -LiteralPath $p -Raw;" ^
    "$c=$c.Replace('[\"/guides\", \"Guides\"]','[\"/aide\", \"Guide d''utilisation\"]');" ^
    "$c=$c.Replace('href=\"/guides\"','href=\"/aide\"');" ^
    "Set-Content -LiteralPath $p -Value $c -Encoding utf8"
)

echo [6/6] Suppression du cache Next.js...
if exist "%PROJECT%\.next" (
    rmdir /s /q "%PROJECT%\.next"
    echo Cache .next supprime.
) else (
    echo Aucun cache .next present.
)

echo.
echo Verification...
if exist "%TARGET%\aide\page.tsx" (
    echo [OK] /aide/page.tsx
) else (
    echo [MANQUANT] /aide/page.tsx
)

if exist "%TARGET%\aide\page.module.css" (
    echo [OK] /aide/page.module.css
) else (
    echo [MANQUANT] /aide/page.module.css
)

if exist "%TARGET%\guides\page.tsx" (
    echo [OK] /guides redirige vers /aide
) else (
    echo [MANQUANT] redirection /guides
)

if exist "%TARGET%\guides\[slug]\page.tsx" (
    echo [OK] /guides/[slug] redirige vers /aide
) else (
    echo [MANQUANT] redirection /guides/[slug]
)

echo.
echo ==========================================================
echo ROLLBACK TERMINE
echo PAGE CONSERVEE : http://localhost:3000/aide
echo SAUVEGARDE : %BACKUP%
echo ==========================================================
echo.
echo Lancez maintenant :
echo npm run dev
echo.
pause
exit /b 0

:not_project
echo ERREUR : package.json est introuvable.
echo Placez ce pack a la racine du projet immobilier.
pause
exit /b 1

:missing_source
echo ERREUR : le dossier package du rollback est incomplet.
pause
exit /b 1

:copy_error
echo ERREUR pendant la copie des fichiers.
echo Verifiez les droits Windows puis recommencez.
pause
exit /b 1
