# Diagnosis of the original Chirombe index

Source inspected: https://github.com/tariromasawi/chirombe
Live surface: https://tariromasawi.github.io/chirombe/

The original system was not empty. It was overloaded.

## Root faults

1. `index.html` is three HTML documents glued together (DOCTYPE at lines 1, 4024, 14742).
2. Console: Identifier STORAGE_KEY has already been declared.
3. Console: Decimals with leading zeros are not allowed in strict mode.
4. Console: ZionProtect.snapshot infinite recursion because the wrapper overwrote the method on the same object.
5. `chirombe engine` (728 KB) does not parse and must not be executed as a script tag.
6. `add 1` is an 18-doctype archive.
7. Hidden frames load app.html and seam.html, so scripts boot twice.
8. data/liturgy-seeds.json 404.

## What this duplicate keeps

Family cover, command bus, protection cycle, liturgy audio, workers, watchdog, covenant, matrix 77-99-33.

## What this duplicate refuses

Concatenated documents, recursive snapshot wrappers, executing the unparseable engine file, hidden iframe double-boot.
