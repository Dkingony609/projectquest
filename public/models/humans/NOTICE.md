# Human asset provenance

The base human anatomy, morphs, rig/weights, eyes, eyebrows, hair, skin, shoes and base clothing originate in MakeHuman / MPFB's CC0 asset collection. CC0 permits commercial use, adaptation and redistribution without attribution; we retain provenance for maintainability.

- MPFB2 base assets: https://github.com/makehumancommunity/mpfb2
- Upstream distinction between GPL authoring code and CC0 graphical assets/output: https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md
- System asset download used: https://github.com/Makehuman-2/MH2_Asset_Repository_CCO/releases/tag/CC0 (`mh_system_CC0.zip`)
- Official system asset manifest: https://github.com/makehumancommunity/makehuman-static-website/blob/master/content/Assets/AssetPacks/makehuman_system_assets.md
- Source credits include Data Collection AB, Joel Palmius, Jonas Hauquier and the MakeHuman community. Individual system garment files identify these authors and explicitly state CC0, September 2020.

Components: young light-skinned male/female skin maps (runtime tintable), male_casualsuit04, female_casualsuit01, shoes01, low-poly eyes/brown eye texture, eyebrow001, short01 male hair and ponytail01 female hair. Textures are resized/neutralised where appropriate, with original skinning and UVs retained. Base-human gender/age/proportion morphs are applied before export. Hidden skin is removed beneath garments.

ProjectQuest supplies the exporter, idle/walk poses, woven fabric albedo, formed hardhat, high-visibility vest, clinical garment adaptations and runtime outfit palettes. These project-authored additions follow the repository's licensing terms; CC0 is not asserted for the entire application. No MPFB GPL program code is included in the game. Blender/MPFB are optional authoring tools, never runtime dependencies.

The full upstream CC0 dedication is included as `CC0-1.0.txt`. `manifest.json` records source archive and delivered GLB checksums; `*.stats.json` records geometry and rig details. See `docs/characters.md` and `scripts/characters/README.md` for implementation and rebuild instructions.
