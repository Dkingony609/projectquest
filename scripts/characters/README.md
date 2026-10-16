# Optional character asset authoring

Playing/building ProjectQuest requires only Node/npm and the committed GLBs. This offline pipeline is for developers changing the actual anatomical humans. It does not smooth or subdivide the original block characters.

## Inputs

Tested with Blender 4.3.2 (glTF exporter included), Python 3 with Pillow/NumPy, and the MPFB2 source tree. Obtain the following public sources and retain their notices:

- https://github.com/makehumancommunity/mpfb2/archive/refs/heads/master.zip — extract as `research/mpfb2-master`.
- https://github.com/Makehuman-2/MH2_Asset_Repository_CCO/releases/tag/CC0 — download `mh_system_CC0.zip`, extract into `research/system-assets`. The recursive asset search tolerates one extra archive root directory. This is the vintage CC0 system collection, not arbitrary user uploads.

Use a cache outside tracked content. For example, set `PROJECTQUEST_CHARACTER_CACHE=/workspace/.cache/projectquest-characters`; otherwise the scripts use `.cache/characters` under the repository. The cache must contain those research directories and has generated `textures` and `build` subdirectories. Blender/MPFB configuration and logs are redirected into that cache by this process-local authoring script, so it does not need write access to a system user profile. No HOME variable is changed.

## Build

From the repository root, with those inputs in place:

```bash
export PROJECTQUEST_CHARACTER_CACHE=/workspace/.cache/projectquest-characters
python3 scripts/characters/prepare_textures.py
blender -b --factory-startup -t 2 --python-exit-code 1 --python scripts/characters/build_humans.py
```

`prepare_textures.py` resizes skin, clothing normal maps, shoes, eyes, brows and hair, neutralises trouser albedo for runtime tinting, and generates a deterministic woven-fabric albedo. The exporter creates proportioned male/female humans with the MPFB game rig, fits source garments/eyes/hair, preserves UVs and skin weights while splitting clothing, removes occluded skin, creates weighted site PPE and clinical variants, and adds in-place Idle/Walk clips from `animate.py`. It exports locally bundled textures, `public/models/humans/human-{male,female}.glb` and per-model statistics, with inspection renders and Blender sources in the untracked cache.

The full exported geometry includes alternative clothing that is hidden at runtime; the stats therefore exceed the visible character triangle count. Models use 53 exported weighted bones. Runtime transforms normalise the anatomical height and grounding independently from PPE. Finger geometry is rigged; the current game clips use natural relaxed hand poses rather than interactive grasping.

After any rebuild, update the SHA-256 and byte counts in `public/models/humans/manifest.json`, retain the source archive hashes/notices, run the normal build/unit/browser checks, and inspect face, hands, both body types, PPE and clinical outfit deformation. A passing exporter alone does not establish visual approval. All regular game commands remain documented in the root README.

## Licensing

MakeHuman graphical inputs are CC0; MPFB program code is GPLv3 and is an optional authoring tool rather than vendored application code. Project-authored export/animation/PPE adaptations remain separate from the source CC0 dedication. Exact component sources and the CC0 text accompany the game in `public/models/humans/NOTICE.md`. See `docs/characters.md` for runtime ownership and limitations.
