# CHIROMBE THRONE

Working duplicate of [tariromasawi/chirombe](https://github.com/tariromasawi/chirombe).

The original repository is preserved. This copy replaces the broken main index with a single connected frontend.

## Why a copy

`index.html` in the original repo is three HTML documents concatenated into one file (DOCTYPE at lines 1, 4024, 14742). That produces:

- `Identifier 'STORAGE_KEY' has already been declared`
- strict-mode numeric parse failures
- `ZionProtect.snapshot` infinite recursion
- double-boot through hidden `app.html` / `seam.html` frames

The 728 KB file named `chirombe engine` remains an archive. It is not executed.

## Public surface

After GitHub Pages is enabled on this repo:

`https://tariromasawi.github.io/chirombe-throne/`

## Modules

- `js/throne-core.js` — bus, family, non-recursive snapshot, state
- `js/throne-audio.js` — Web Audio matrix field 77 / 99 / 33
- `js/throne-matrix.js` — canvas field
- `js/throne-ui.js` — one-page navigation
- `data/family.json` — House of Masawi roster

## Creed

Mwari ndi Mwari.
