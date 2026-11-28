# Preset photos and configurator backgrounds

## Current background (2026-11-27)

- Source: `C:/Users/48501/Desktop/Przytulne wnetrze z regalem i roslinami.png` (actual source filename uses Polish diacritics).
- Working asset: `assets/background-interior.png`.
- Published-site asset copy: `public/configurator/assets/background-interior.png`.
- Fourth background choice: `interior`, displayed as Wnetrze (with Polish diacritics).
- Current presentation: centered CSS cover, without synchronized zoom/pan.
- This background addition has been checked locally; publication is a separate step.

## Agreed future workflow

The user will supply wider original photographs. Preset tile images will be
cropped from those same wider photographs, rather than shot separately.
The preset tile should show a real guitar in the corresponding configuration.
Entering the editor should retain the matching room background while replacing
the real guitar with the editable 3D model.

Reference guitar photos:
- `C:/Users/48501/Desktop/Weirdo/DSC05987.JPG`
- `C:/Users/48501/Desktop/Weirdo/DSC05988.JPG`

For each camera setup, capture both the guitar and a clean background without
the foreground guitar or its stand. Keep the camera fixed on a tripod and retain
the same focal length, exposure, white balance and manual focus for both shots.
Keep the rest of the scene unchanged. A clean plate avoids a second guitar
remaining visible behind the rendered model.

Suggested source: full-resolution original, ideally approximately 6000 x 4000
pixels (width x height), landscape, with the complete guitar centered and
occupying about 65-75 percent of frame height. These are framing targets, not
mandatory dimensions. Leave space above, below and on both sides for responsive
crops. Prefer stepping back to an extreme wide-angle perspective.
Do not upscale or pre-crop the only original. Keep a high-quality JPG and RAW
when available; optimized web derivatives can be generated later.

## Future implementation, not yet implemented

- Associate each preset with its real photo, clean background and crop/alignment
  metadata (instrument center, head and body-bottom anchors).
- Generate portrait preset crops from the wide originals.
- Align the 3D model to the photographed instrument at the initial front view.
- Add a separate background layer with coordinated zoom/pan and limits that
  avoid exposing empty edges. A 2D room photo should not rotate with the guitar.
- Preserve the current three non-photographic background choices.
- Keep original photo resolution separate from optimized runtime assets.
