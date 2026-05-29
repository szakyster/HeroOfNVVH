# Production Release Draft

Ez a dokumentum a következő produktív minor kiadás technikai előkészítését és kiadási anyagát foglalja össze.

## Verification Snapshot

Ellenőrzött parancsok:

```bash
npm run build
npm run test:run
npm run test:coverage -- --run
```

Eredmény:
- build sikeres
- teljes tesztcsomag sikeres: 34/34 tesztfájl, 178/178 teszt
- a releváns fájlok coverage-e 25% felett van

Kiemelt coverage értékek:
- `src/scenes/PlayScene.ts`: 57.65%
- `src/scenes/playScene/PlaySceneHud.ts`: 47.43%
- `src/scenes/MenuScene.ts`: 97.82%
- `src/scenes/LeaderboardScene.ts`: 91.42%
- `src/scenes/GameOverScene.ts`: 96.42%
- `src/systems/UiButtons.ts`: 100%

## Suggested Release Identifier

Javasolt tag:

```text
v0.2.0
```

Megjegyzés:
- a `package.json` verzió frissítve lett `0.2.0` értékre
- a kiadási tagot érdemes ehhez igazítani

## Suggested Annotated Tag Message

```text
Heroes of NVVH 0.2.0

Minor production release with corrected score milestone copy,
stable gameplay behavior, and unchanged deployment flow.
```

## GitHub Release Title Draft

```text
Heroes of NVVH v0.2.0
```

## GitHub Release Body Draft

```md
## Heroes of NVVH v0.2.0

Ez a build a Heroes of NVVH első produktív minor kiadása.

### Mi van benne?
- javított score milestone-szövegek a pályaadatokban
- kisebb helyesírási és megfogalmazási korrekciók a játék közbeni milestone popupokhoz
- változatlan gameplay loop, pályafolyamat és release/deploy folyamat

### Fontos tudnivalók
- ez egy minor frissítés az első produktív kiadásra építve
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
- produktív kiadási verzió és státusz
- deploy trigger pontosítása
- release draft helye
- kiadási kiemelések és fő kockázatok

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
- a PlayScene továbbra is nagy, 1443 soros fájl, bár még a 1500-as repo küszöb alatt van
- fallback hibaszöveg lokalizációja és megjelenése még nyersebb, mint a többi UI elem