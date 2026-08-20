param(
  [Parameter(Mandatory = $true)]
  [string]$FilePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $FilePath)) {
  Write-Host "[INFO] Fichier non trouve : $FilePath"
  exit 0
}

$content = [System.IO.File]::ReadAllText(
  $FilePath,
  [System.Text.Encoding]::UTF8
)

$replacements = [ordered]@{
  "Ã€" = "À"
  "Ã‚" = "Â"
  "Ã‡" = "Ç"
  "Ãˆ" = "È"
  "Ã‰" = "É"
  "ÃŠ" = "Ê"
  "Ã‹" = "Ë"
  "ÃŽ" = "Î"
  "Ã”" = "Ô"
  "Ã™" = "Ù"
  "Ã›" = "Û"
  "Ãœ" = "Ü"
  "Ã " = "à"
  "Ã¢" = "â"
  "Ã§" = "ç"
  "Ã¨" = "è"
  "Ã©" = "é"
  "Ãª" = "ê"
  "Ã«" = "ë"
  "Ã®" = "î"
  "Ã¯" = "ï"
  "Ã´" = "ô"
  "Ã¶" = "ö"
  "Ã¹" = "ù"
  "Ã»" = "û"
  "Ã¼" = "ü"
  "â€™" = "’"
  "â€˜" = "‘"
  "â€œ" = "“"
  "â€" = "”"
  "â€“" = "–"
  "â€”" = "—"
  "â€¦" = "…"
  "Â«" = "«"
  "Â»" = "»"
  "Â " = " "
}

$changed = $false

foreach ($entry in $replacements.GetEnumerator()) {
  if ($content.Contains($entry.Key)) {
    $content = $content.Replace($entry.Key, $entry.Value)
    $changed = $true
  }
}

if ($changed) {
  $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

  [System.IO.File]::WriteAllText(
    $FilePath,
    $content,
    $utf8WithoutBom
  )

  Write-Host "[OK] Encodage repare : $FilePath"
} else {
  Write-Host "[OK] Aucun caractere corrompu dans : $FilePath"
}
