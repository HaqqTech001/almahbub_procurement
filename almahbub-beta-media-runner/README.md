# Almahbub beta product media runner

This package removes the need to upload product images one by one.

## What it does

1. Reads the ranked 250-product first-wave manifest in `globalPriority` order.
2. Searches Wikimedia Commons for each product.
3. Accepts only conservative reusable-photo candidates with Commons licensing metadata.
4. Rejects obvious logos, diagrams, screenshots, tiny files and duplicate binaries.
5. Downloads the original image binary into `staging/`.
6. Creates `provenance.json` with source/licence/creator/checksum.
7. Creates `media-import-mapping.json` in the mapping shape used by the repository's existing `import-catalog-media.ts`.
8. Creates `review.html` so you can rapidly inspect the batch in a browser.

A product that cannot be matched confidently is **not** assigned a random image. It remains on the existing category fallback and is listed as `needs_review`.

The active queue excludes POS terminals and fabric-first presentation, prioritizing office machines and high-impact finished goods. See `../catalogue-package/high-priority-media-queue.md` for ranks and coverage gaps. Exact branded/model research tasks live separately in `../catalogue-package/current-product-research.json`; they must not be sent to generic image generation. The runner still acquires source photographs; `mediaRoute: generation_ready` permits a separate reviewed generic-generation workflow, not automatic generation by this script.

Existing `provenance.json`, `media-import-mapping.json` and `review.html` are historical acquisition outputs, not the updated priority queue. This queue revision does not regenerate them, acquire images, import anything or modify published products.

## Put it in the repo

Extract this folder directly into:

`C:\Users\USER\Downloads\almahbub-procurement\almahbub-procurement\almahbub-beta-media-runner`

so that the repo still contains `apps\api\package.json` one level above this folder.

## Command 1: acquire images

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\almahbub-beta-media-runner\run-acquire.ps1
```

For a smaller first test batch:

```powershell
powershell -ExecutionPolicy Bypass -File .\almahbub-beta-media-runner\run-acquire.ps1 -Limit 20
```

The script is resumable. Running it again skips already acquired products.

Then open:

`almahbub-beta-media-runner\review.html`

This is only a quick sanity check. You do not upload anything manually.

## Command 2: dry-run the existing Almahbub importer

```powershell
powershell -ExecutionPolicy Bypass -File .\almahbub-beta-media-runner\run-import.ps1
```

The repository's importer is dry-run by default, so this should write nothing.

## Command 3: execute import

Only after the dry run reports the mappings correctly:

```powershell
powershell -ExecutionPolicy Bypass -File .\almahbub-beta-media-runner\run-import.ps1 -Execute
```

This invokes the existing API script:

`apps/api/src/scripts/import-catalog-media.ts`

with `--media-root`, `--mapping`, and `--execute`. The API package name is read automatically from `apps/api/package.json`, so the PowerShell helper does not guess it.

## Important beta behavior

Products that do not get a safe, high-confidence image should continue to use the category fallback. Do not attach a vaguely similar or duplicate image just to reach 100/100.

The resulting provenance should be retained with the project because Commons licences can require attribution and/or share-alike obligations.
