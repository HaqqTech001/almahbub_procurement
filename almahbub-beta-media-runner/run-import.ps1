param(
  [switch]$Execute
)
$ErrorActionPreference = 'Stop'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Repo = Resolve-Path (Join-Path $Here '..')
$ApiPackageJson = Join-Path $Repo 'apps\api\package.json'
if (!(Test-Path $ApiPackageJson)) {
  throw "This folder must be extracted directly inside the Almahbub repository root. apps/api/package.json was not found at $ApiPackageJson"
}
$Pkg = (Get-Content $ApiPackageJson -Raw | ConvertFrom-Json).name
if (!$Pkg) { throw 'apps/api/package.json has no package name' }
$MediaRoot = Join-Path $Here 'staging'
$Mapping = Join-Path $Here 'media-import-mapping.json'
if (!(Test-Path $Mapping)) { throw 'media-import-mapping.json missing. Run run-acquire.ps1 first.' }
if (!(Test-Path $MediaRoot)) { throw 'staging folder missing. Run run-acquire.ps1 first.' }

$Args = @('--filter', $Pkg, 'exec', 'tsx', 'src/scripts/import-catalog-media.ts', '--media-root', $MediaRoot, '--mapping', $Mapping)
if ($Execute) { $Args += '--execute' }

if ($Execute) {
  Write-Host "Executing DB/storage import for approved acquired media..." -ForegroundColor Yellow
} else {
  Write-Host "DRY RUN ONLY. Nothing will be written. If clean, rerun with -Execute." -ForegroundColor Cyan
}
& pnpm @Args
exit $LASTEXITCODE
