param(
  [int]$Limit = 100,
  [int]$Start = 0
)
$ErrorActionPreference = 'Stop'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Get-Command py -ErrorAction SilentlyContinue
if ($Python) {
  & py -3 "$Here\acquire_beta_media.py" --manifest "$Here\beta-product-media-manifest.json" --out staging --mapping media-import-mapping.json --provenance provenance.json --limit $Limit --start $Start
} else {
  & python "$Here\acquire_beta_media.py" --manifest "$Here\beta-product-media-manifest.json" --out staging --mapping media-import-mapping.json --provenance provenance.json --limit $Limit --start $Start
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "`nAcquisition complete. Open this file to visually review:" -ForegroundColor Green
Write-Host "$Here\review.html"
