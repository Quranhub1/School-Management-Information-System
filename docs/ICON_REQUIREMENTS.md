# Application Icon Requirements

The approved application icon must use the supplied project icon artwork and be named exactly:

`icon.png`

## Release requirement

The final icon must be copied to every client/resource location that consumes an application icon (web/PWA, desktop packaging, installers and platform-specific resources where applicable). Each location must reference the same approved artwork.

## Verification

- [ ] `icon.png` exists at the web/PWA icon location.
- [ ] `icon.png` exists at the desktop/resource location.
- [ ] Desktop packaging metadata points to the approved icon.
- [ ] Installer/package metadata points to the approved icon where applicable.
- [ ] No obsolete production icon remains referenced.
