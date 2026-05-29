# HeroOfNVVH

Heroes of NVVH egy Phaser + TypeScript alapú böngészős játékprototípus. A projekt jelenleg már futtatható játékot tartalmaz menüvel, játéktérrel, HUD-dal, audióval és helyi eredménylistával.

## Aktuális kiadás

- Verzió: `0.2.0`
- Státusz: produktív kiadás
- Publikus build: `https://szakyster.github.io/HeroOfNVVH/`

## Következő célkiadás

- Cél: stabilizációs és optimalizálási utókövetés a milestone-szövegjavításokat tartalmazó minor kiadás után
- Release előkészítés: build, teljes tesztkör, coverage, release note draft és deploy ellenőrzés elkészült
- Release trigger: GitHub tag push

Ez a kiadás már produktív, publikus linkkel elérhető buildként kezelhető. A `0.2.0` minor verzió a pályák milestone-szövegeinek javítását hozza, gameplay-viselkedés módosítása nélkül.

## Fejlesztői indulás

### Előfeltételek
- Node.js 22 vagy újabb
- npm

### Telepítés
```bash
npm install
```

### Fejlesztői futtatás
```bash
npm run dev
```

### Production build
```bash
npm run build
```

### Lokális build preview
```bash
npm run preview
```

### Tesztek
```bash
npm run test:run
```

### Coverage
```bash
npm run test:coverage
```

## Projektstruktúra
- `src/scenes/` - Phaser scene-ek
- `src/scenes/playScene/` - a PlayScene-ből kiszervezett scene-közeli helper modulok
- `src/systems/` - újrafelhasználható gameplay rendszerek
- `public/` - statikus assetek és pályaadatok
- `docs/` - architektúra, játékleírás, technikai és vizuális dokumentáció

## Aktuális implementációs állapot
- A scene flow jelenleg: `BootScene` -> `MenuScene` -> `PlayScene` -> `GameOverScene`, valamint külön `LeaderboardScene`.
- A `PlayScene` vékonyabb orchestrator szerepet tölt be, és a HUD, world, spawning, enemy, combat, loot, hero, player timing és effects logika külön helper fájlokba van bontva a `src/scenes/playScene/` mappában.
- A karakteranimációk sprite sheet alapon működnek: a hős idle/run/punch állapotokkal, az ellenségek pedig `enemy01`-`enemy04` walk és injured sheet családokkal.
- A task-lezárási workflow egyszeri tesztfuttatásra a `npm run test:run` scriptet használja.

## Dokumentáció
- [ArtDirectionAIPipeline](docs/ArtDirectionAIPipeline.md) - AI promptolási, exportálási és assetgyártási szabályok
- [Architecture](docs/Architecture.md) - architektúra és scene/system felelősségek
- [Decisions](docs/Decisions.md) - rögzített technikai és termékdöntések
- [JatekLeiras](docs/JatekLeiras.md) - játékszabályok és feature specifikáció
- [Tech](docs/Tech.md) - stack, projektstruktúra, implementációs jegyzetek
- [Vizualitas](docs/Vizualitas.md) - vizuális irányelvek és HUD elvárások
- [conceptart01.svg](docs/conceptart01.svg) - elsődleges koncept-art referencia
- [conceptart02.svg](docs/conceptart02.svg) - kiegészítő koncept-art referencia

## Deploy
- A projekt GitHub Pages-re van előkészítve.
- A deploy workflow a a release tag esetén fut le.
- A Vite build a GitHub Pages repository útvonalához van igazítva.

## Licenc

Ez a projekt MIT licenc alatt érhető el. A részletek a [LICENSE](LICENSE) fájlban találhatók.
