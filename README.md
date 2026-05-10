# HeroOfNVVH

Heroes of NVVH egy Phaser + TypeScript alapú böngészős játékprototípus. A projekt jelenleg már futtatható játékot tartalmaz menüvel, játéktérrel, HUD-dal, audióval és helyi eredménylistával.

## Aktuális kiadás

- Verzió: `0.1.0-alpha.1`
- Státusz: alfa / pre-release
- Publikus build: `https://szakyster.github.io/HeroOfNVVH/`

Ez a kiadás már játszható és publikus linkkel elérhető, de még nem végleges. A balansz, a vizuális polish és az általános stabilitás tovább változhat.

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
npm run test -- --run
```

### Coverage
```bash
npm run test:coverage -- --run
```

## Projektstruktúra
- `src/scenes/` - Phaser scene-ek
- `src/systems/` - újrafelhasználható gameplay rendszerek
- `public/` - statikus assetek és pályaadatok
- `docs/` - architektúra, játékleírás, technikai és vizuális dokumentáció

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
- A deploy workflow a `main` ágra történő push esetén fut le.
- A Vite build a GitHub Pages repository útvonalához van igazítva.

## Licenc

Ez a projekt MIT licenc alatt érhető el. A részletek a [LICENSE](LICENSE) fájlban találhatók.
