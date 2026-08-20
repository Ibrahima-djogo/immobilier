param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

Write-Host ""
Write-Host "============================================================"
Write-Host "  DEMEURE GUINEE - GENERATION DES PAGES FRONT-END"
Write-Host "============================================================"
Write-Host ""

if (-not (Test-Path -LiteralPath "package.json")) {
    Write-Host "[ERREUR] Placez ces deux fichiers a la racine du projet Next.js." -ForegroundColor Red
    Write-Host "Le dossier doit contenir package.json."
    exit 1
}

if (Test-Path -LiteralPath "src\app") {
    $appDir = "src\app"
    $srcDir = "src"
}
elseif (Test-Path -LiteralPath "app") {
    $appDir = "app"
    $srcDir = "."
}
else {
    Write-Host "[ERREUR] Aucun dossier src\app ou app n'a ete trouve." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Dossier App Router detecte : $appDir"

# Nettoyage prudent : cache et fichiers de demonstration de la page d'accueil.
if (Test-Path -LiteralPath ".next") {
    Remove-Item -LiteralPath ".next" -Recurse -Force
    Write-Host "[NETTOYAGE] Cache .next supprime."
}

$rootPage = Join-Path $appDir "page.tsx"
$rootCss = Join-Path $appDir "page.module.css"

if (Test-Path -LiteralPath $rootPage) {
    Remove-Item -LiteralPath $rootPage -Force
    Write-Host "[NETTOYAGE] Ancienne page d'accueil de demonstration supprimee."
}

if (Test-Path -LiteralPath $rootCss) {
    Remove-Item -LiteralPath $rootCss -Force
    Write-Host "[NETTOYAGE] Ancien CSS de demonstration supprime."
}

$demoAssets = @(
    "public\next.svg",
    "public\vercel.svg",
    "public\globe.svg",
    "public\file.svg",
    "public\window.svg"
)

foreach ($asset in $demoAssets) {
    if (Test-Path -LiteralPath $asset) {
        Remove-Item -LiteralPath $asset -Force
    }
}

$pages = @(
    [pscustomobject]@{ Path = "(public)"; Title = "Accueil" },
    [pscustomobject]@{ Path = "(public)\annonces"; Title = "Toutes les annonces" },
    [pscustomobject]@{ Path = "(public)\annonces\[slug]"; Title = "Détail de l'annonce" },
    [pscustomobject]@{ Path = "(public)\recherche"; Title = "Recherche immobilière" },
    [pscustomobject]@{ Path = "(public)\agences"; Title = "Agences immobilières" },
    [pscustomobject]@{ Path = "(public)\agences\[slug]"; Title = "Profil de l'agence" },
    [pscustomobject]@{ Path = "(public)\connexion"; Title = "Connexion" },
    [pscustomobject]@{ Path = "(public)\inscription"; Title = "Inscription" },
    [pscustomobject]@{ Path = "(public)\mot-de-passe-oublie"; Title = "Mot de passe oublié" },
    [pscustomobject]@{ Path = "(public)\a-propos"; Title = "À propos" },
    [pscustomobject]@{ Path = "(public)\contact"; Title = "Contact" },
    [pscustomobject]@{ Path = "(public)\aide"; Title = "Centre d'aide" },
    [pscustomobject]@{ Path = "(public)\faq"; Title = "Questions fréquentes" },
    [pscustomobject]@{ Path = "(public)\conditions-utilisation"; Title = "Conditions d'utilisation" },
    [pscustomobject]@{ Path = "(public)\confidentialite"; Title = "Politique de confidentialité" },

    [pscustomobject]@{ Path = "(dashboard)\tableau-de-bord"; Title = "Tableau de bord" },
    [pscustomobject]@{ Path = "(dashboard)\profil"; Title = "Mon profil" },
    [pscustomobject]@{ Path = "(dashboard)\securite"; Title = "Sécurité du compte" },
    [pscustomobject]@{ Path = "(dashboard)\favoris"; Title = "Mes favoris" },
    [pscustomobject]@{ Path = "(dashboard)\notifications"; Title = "Mes notifications" },
    [pscustomobject]@{ Path = "(dashboard)\demande-role"; Title = "Demander un rôle" },
    [pscustomobject]@{ Path = "(dashboard)\demande-role\suivi"; Title = "Suivi de la demande de rôle" },
    [pscustomobject]@{ Path = "(dashboard)\demandes-contact"; Title = "Mes demandes de contact" },
    [pscustomobject]@{ Path = "(dashboard)\mes-biens"; Title = "Mes biens" },
    [pscustomobject]@{ Path = "(dashboard)\mes-biens\nouveau"; Title = "Ajouter un bien" },
    [pscustomobject]@{ Path = "(dashboard)\mes-biens\[id]"; Title = "Détail du bien" },
    [pscustomobject]@{ Path = "(dashboard)\mes-biens\[id]\modifier"; Title = "Modifier le bien" },
    [pscustomobject]@{ Path = "(dashboard)\mes-annonces"; Title = "Mes annonces" },
    [pscustomobject]@{ Path = "(dashboard)\mes-annonces\nouvelle"; Title = "Créer une annonce" },
    [pscustomobject]@{ Path = "(dashboard)\mes-annonces\[id]"; Title = "Détail de mon annonce" },
    [pscustomobject]@{ Path = "(dashboard)\mes-annonces\[id]\modifier"; Title = "Modifier mon annonce" },
    [pscustomobject]@{ Path = "(dashboard)\mes-annonces\[id]\previsualisation"; Title = "Prévisualiser l'annonce" },
    [pscustomobject]@{ Path = "(dashboard)\prospects"; Title = "Mes prospects" },
    [pscustomobject]@{ Path = "(dashboard)\prospects\[id]"; Title = "Détail du prospect" },

    [pscustomobject]@{ Path = "(admin)\administration"; Title = "Administration" },
    [pscustomobject]@{ Path = "(admin)\administration\utilisateurs"; Title = "Gestion des utilisateurs" },
    [pscustomobject]@{ Path = "(admin)\administration\utilisateurs\[id]"; Title = "Détail de l'utilisateur" },
    [pscustomobject]@{ Path = "(admin)\administration\demandes-role"; Title = "Demandes de rôle" },
    [pscustomobject]@{ Path = "(admin)\administration\demandes-role\[id]"; Title = "Examen de la demande" },
    [pscustomobject]@{ Path = "(admin)\administration\annonces"; Title = "Gestion des annonces" },
    [pscustomobject]@{ Path = "(admin)\administration\annonces\[id]"; Title = "Contrôle de l'annonce" },
    [pscustomobject]@{ Path = "(admin)\administration\moderation"; Title = "File de modération" },
    [pscustomobject]@{ Path = "(admin)\administration\signalements"; Title = "Signalements" },
    [pscustomobject]@{ Path = "(admin)\administration\signalements\[id]"; Title = "Traitement du signalement" },
    [pscustomobject]@{ Path = "(admin)\administration\referentiels"; Title = "Référentiels" },
    [pscustomobject]@{ Path = "(admin)\administration\referentiels\villes"; Title = "Gestion des villes" },
    [pscustomobject]@{ Path = "(admin)\administration\referentiels\quartiers"; Title = "Gestion des quartiers" },
    [pscustomobject]@{ Path = "(admin)\administration\referentiels\categories"; Title = "Catégories de biens" },
    [pscustomobject]@{ Path = "(admin)\administration\referentiels\equipements"; Title = "Équipements" },
    [pscustomobject]@{ Path = "(admin)\administration\statistiques"; Title = "Statistiques globales" },
    [pscustomobject]@{ Path = "(admin)\administration\audit"; Title = "Journal d'activité" },
    [pscustomobject]@{ Path = "(admin)\administration\contenus"; Title = "Contenus publics" },
    [pscustomobject]@{ Path = "(admin)\administration\parametres"; Title = "Paramètres" },
    [pscustomobject]@{ Path = "(admin)\administration\administrateurs"; Title = "Gestion des administrateurs" }
)

$cssContent = @'
.page {
  min-height: 100vh;
  padding: 32px 20px;
  background: #f7f8fa;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  margin-bottom: 12px;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #17202a;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  color: #667085;
}

@media (max-width: 768px) {
  .page {
    padding: 24px 16px;
  }
}
'@

$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
$createdPages = 0
$skippedPages = 0

foreach ($item in $pages) {
    $pageDirectory = Join-Path $appDir $item.Path
    [System.IO.Directory]::CreateDirectory($pageDirectory) | Out-Null

    $pageFile = Join-Path $pageDirectory "page.tsx"
    $cssFile = Join-Path $pageDirectory "page.module.css"

    $pageContent = @"
import styles from "./page.module.css";

export default function Page() {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <h1 className={styles.title}>$($item.Title)</h1>
        <p className={styles.description}>
          Interface front-end de Demeure Guinée.
        </p>
      </section>
    </main>
  );
}
"@

    if ($Force -or -not [System.IO.File]::Exists($pageFile)) {
        [System.IO.File]::WriteAllText($pageFile, $pageContent, $utf8WithoutBom)
        $createdPages++
        Write-Host "[PAGE] $pageFile"
    }
    else {
        $skippedPages++
        Write-Host "[IGNORE] $pageFile existe deja."
    }

    if ($Force -or -not [System.IO.File]::Exists($cssFile)) {
        [System.IO.File]::WriteAllText($cssFile, $cssContent, $utf8WithoutBom)
        Write-Host "[CSS]  $cssFile"
    }
}

$sharedFolders = @(
    "components\ui",
    "components\layout",
    "components\property",
    "components\search",
    "components\forms",
    "components\dashboard",
    "components\admin",
    "components\feedback",
    "features\auth",
    "features\users",
    "features\role-requests",
    "features\properties",
    "features\listings",
    "features\favorites",
    "features\leads",
    "features\notifications",
    "features\moderation",
    "services",
    "hooks",
    "types",
    "schemas",
    "stores",
    "constants",
    "utils",
    "data"
)

foreach ($relativeFolder in $sharedFolders) {
    $folder = Join-Path $srcDir $relativeFolder
    [System.IO.Directory]::CreateDirectory($folder) | Out-Null

    $gitkeep = Join-Path $folder ".gitkeep"
    if (-not [System.IO.File]::Exists($gitkeep)) {
        [System.IO.File]::WriteAllText($gitkeep, "", $utf8WithoutBom)
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "  CREATION TERMINEE"
Write-Host "============================================================"
Write-Host "[OK] Pages creees : $createdPages"
Write-Host "[OK] Pages deja presentes : $skippedPages"
Write-Host "[OK] Chaque page possede son fichier page.module.css."
Write-Host ""
Write-Host "Verification :"
Write-Host "  tree $appDir /F"
Write-Host ""
Write-Host "Lancement :"
Write-Host "  npm run dev"
Write-Host ""
