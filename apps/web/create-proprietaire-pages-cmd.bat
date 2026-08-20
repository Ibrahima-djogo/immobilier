@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "BASE=src\app\(dashboard)\proprietaire"

echo.
echo ==========================================================
echo CREATION DES PAGES PROPRIETAIRE
echo ==========================================================
echo.

if exist "%BASE%" goto base_ready
md "%BASE%"
echo [DOSSIER CREE] %BASE%

:base_ready
call :create_page "biens"
call :create_page "biens\nouveau"
call :create_page "biens\[slug]"
call :create_page "biens\[slug]\modifier"

call :create_page "annonces"
call :create_page "annonces\nouvelle"
call :create_page "annonces\[id]"
call :create_page "annonces\[id]\modifier"

call :create_page "contacts"
call :create_page "contacts\[id]"

call :create_page "statistiques"

echo.
echo ==========================================================
echo CREATION TERMINEE
echo Les fichiers deja existants ont ete conserves.
echo ==========================================================
echo.

tree "%BASE%" /F
echo.
pause
exit /b 0


:create_page
set "RELATIVE=%~1"
set "TARGET=%BASE%\%RELATIVE%"
set "TSX=%TARGET%\page.tsx"
set "CSS=%TARGET%\page.module.css"

if exist "%TARGET%" goto directory_exists
md "%TARGET%"
echo [DOSSIER CREE] %TARGET%
goto directory_done

:directory_exists
echo [DOSSIER EXISTANT] %TARGET%

:directory_done
if exist "%TSX%" goto tsx_exists

>"%TSX%" echo import styles from "./page.module.css";
>>"%TSX%" echo.
>>"%TSX%" echo export default function Page^(^) ^{
>>"%TSX%" echo   return ^(
>>"%TSX%" echo     ^<main className={styles.page}^>
>>"%TSX%" echo       ^<h1^>Page en preparation^</h1^>
>>"%TSX%" echo       ^<p^>Cette page sera remplacee par le contenu final.^</p^>
>>"%TSX%" echo     ^</main^>
>>"%TSX%" echo   ^);
>>"%TSX%" echo }

echo [FICHIER CREE] %TSX%
goto tsx_done

:tsx_exists
echo [FICHIER CONSERVE] %TSX%

:tsx_done
if exist "%CSS%" goto css_exists

>"%CSS%" echo .page ^{
>>"%CSS%" echo   min-height: 100vh;
>>"%CSS%" echo   padding: 40px;
>>"%CSS%" echo }

echo [FICHIER CREE] %CSS%
goto css_done

:css_exists
echo [FICHIER CONSERVE] %CSS%

:css_done
echo.
exit /b 0
