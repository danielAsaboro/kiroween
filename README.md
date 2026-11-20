# kiroween

Puts modern design and job files onto machines that only read floppies and old formats, in the browser.

## Layout

```
skeleton/        format codecs generated from specs, round-trip property tests, FAT12 disk-image writer
apps/app-one/    embroidery: open a design, preview stitches, check machine limits, write the old format and a disk
apps/app-two/    versioned job library that writes floppy images for old machine controllers
.kiro/           Kiro specs, steering and hooks
tools/oracles/   dev-only checkers (pyembroidery dump, floppy image check)
fixtures/        sample files for the oracles
```

## Run

Needs Node 24 and pnpm.

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Oracles: see `tools/oracles/README.md`.

## Hard requirements

- [ ] Public GitHub repo, licence shown in the About panel
- [ ] `/.kiro` at the root, not in `.gitignore`
- [ ] `/skeleton`, `/apps/app-one`, `/apps/app-two`
- [ ] Built in Kiro; new work since Oct 30 2026
- [ ] Working URL, free and live until Jan 29 2027
- [ ] Public YouTube video under 3:00
- [ ] Write-up of Kiro usage by feature
- [ ] Submitted before Dec 4 2026 22:00 UTC

## Licence

MIT
