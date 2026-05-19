# Playable Beta Release Draft

Ez a dokumentum a következő játszható béta pre-release technikai előkészítését foglalja össze.

## Verification Snapshot

Ellenőrzött parancsok:

```bash
npm run build
npm run test:run
npx vitest --run --coverage
```

Eredmény:
- build sikeres
- teljes tesztcsomag sikeres: 28/28 tesztfájl, 158/158 teszt
- a releváns fájlok coverage-e 25% felett van

Kiemelt coverage értékek:
- `src/scenes/PlayScene.ts`: 57.36%
- `src/scenes/playScene/PlaySceneHud.ts`: 45.83%
- `src/scenes/MenuScene.ts`: 97.72%
- `src/scenes/LeaderboardScene.ts`: 96.55%
- `src/scenes/GameOverScene.ts`: 96.42%
- `src/systems/UiButtons.ts`: 100%

## Suggested Release Identifier

Javasolt tag:

```text
v0.1.0-beta.1
```

Megjegyzés:
- a `package.json` verzió frissítve lett `0.1.0-beta.1` értékre
- a kiadási tagot érdemes ehhez igazítani

## Suggested Annotated Tag Message

```text
Heroes of NVVH playable beta 1

First playable beta release candidate with unified UI styling, improved scene navigation,
escaped enemy alarm feedback, and current GitHub Pages release preparation.
```

## GitHub Release Title Draft

```text
Heroes of NVVH v0.1.0-beta.1 - Playable Beta
```

## GitHub Release Body Draft

```md
## Heroes of NVVH - Playable Beta

Ez a build az első játszható béta pre-release a Heroes of NVVH projekthez.

### Mi van benne?
- végigjátszható alap gameplay loop menüvel, HUD-dal, game over flow-val és leaderboarddal
- egységesített, erősebb vizuális karakterű UI gombok és scene UI polish
- escaped enemy warning audio feedback
- gyorsbillentyűs navigáció a fő scene-ek között
- helyi eredménylista LocalStorage alapon
- GitHub Pages-re előkészített statikus build

### Fontos tudnivalók
- ez még béta kiadás, nem végleges release
- balansz, vizuális finomhangolás és bundle-optimalizálás még várható
- a release továbbra is ismert nagy bundle warninggal épül, ez jelenleg nem blokkoló

### Javasolt smoke test
- játék indítása a főmenüből
- loot pickup és leadás
- escaped counter és warning state ellenőrzése
- game over, leaderboard és menü közti navigáció ellenőrzése
- zene és SFX kapcsolók ellenőrzése
```

## Documentation Minimum

Frissítve:
- `README.md`
- `CHANGELOG.md`

Mit fednek le most:
- aktuális publikus állapot
- következő célkiadás: játszható béta
- deploy trigger pontosítása
- release draft helye
- várható béta kiemelések és fő kockázatok

## Config And Asset Audit

Ellenőrzött pontok:
- Vite `base` beállítás: `/HeroOfNVVH/`
- build output: `dist`
- GitHub Pages workflow létezik
- Pages artifact a `dist` mappából készül
- új alarm asset elérhető: `public/assets/audio/alarm.mp3`

Jelenlegi megfigyelések:
- a deploy workflow tag push-ra indul, nem `main` push-ra
- a build stabil, de továbbra is nagy bundle warningot jelez
- nincs nyilvánvaló runtime debug hotkey vagy TODO/FIXME maradvány a release-szempontból vizsgált forrásokban
- a `Palyabetoltes hiba` fallback string release-ben is megjelenhet, ha a pályabetöltés hibára fut

## Deployment Readiness

Jelenlegi állapot:
- GitHub Pages workflow konfigurálva van
- Node 22 használat be van állítva workflow szinten
- a build Pages-kompatibilis base path-tal készül

Release előtti teendők:
1. Annotált tag létrehozása a release commitra.
2. Tag push az originre.
3. GitHub Release létrehozása a fenti draft szöveggel.
4. Deploy workflow sikerének ellenőrzése a Pages environmenten.

## Current Release Risks

Nem blokkoló, de nyomon követendő:
- nagy bundle warning a production build során
- a PlayScene továbbra is nagy, 1399 soros fájl, bár még a 1500-as repo küszöb alatt van
- fallback hibaszöveg lokalizációja és megjelenése még nyersebb, mint a többi UI elem