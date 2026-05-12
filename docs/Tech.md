# Heroes of NVVH – Technológiai specifikáció

## 1. Projekt célja és alapvetések

Ez a dokumentum rögzíti a Heroes of NVVH HTML5 játék megvalósításához szükséges technológiai stacket, külső library-kat, build toolsokat és fejlesztési workflow-t.

**Célok:**
- Gyors, stabil prototípus-fejlesztés,
- böngészőben futó, könnyen tesztelhető kód,
- moduláris, kiterjeszthető architektúra,
- offline-capable (localStorage),
- könnyű deployment.

---

## 2. Alapválasztások

| Szempont | Választás | Indoklás | Döntés ID |
|---------|----------|----------|-----------|
| **Nyelvv** | TypeScript | Típusbiztonság, jobb IDE támogatás, nagyobb projektek közül tanulható | D-002 |
| **Engine** | Phaser 3 | Teljes 2D framework, beépített input/physics/scene/audio, nagyközösség | D-001 |
| **Build tool** | Vite | Gyors dev server, optimális production build, natív ES modules | D-003 |
| **Test framework** | Vitest | Vite-nal integrálva, gyors, Jest-kompatibilis szintaxis | D-004 |
| **Pályatárolás** | JSON (custom) | Egyszerű, könnyen szerkeszthető, gyors loadás | D-006 |
| **Collision detection** | Saját, cserélhető abstraction mögött | MVP-re egyszerű rectangle alapú logika, később lecserélhető | D-014 |
| **Deploy** | GitHub Pages | Ingyen hosting direkt a repo-ból | D-005 |
| **Verziókezelés** | Git + GitHub | Standard, már beállítva |

---

## 3. Fő technológiák és library-k

### 3.1 Runtime (böngésző)

#### Phaser 3
- **Verzió:** 3.55+ (legutóbbi stabil)
- **Telepítés:** `npm install phaser`
- **Szerepe:** 
  - 2D sprite rendering,
  - input management (keyboard, mouse, touch),
  - physics engine (opcionális, kezdetben nem kell),
  - scene management,
  - animations,
  - audio (opcionális),
  - timer / tween system.
- **Docs:** https://phaser.io/docs/3.55

#### TypeScript
- **Verzió:** 4.9+
- **Telepítés:** `npm install --save-dev typescript`
- **Szerepe:**
  - Típusbiztonság,
  - IntelliSense az IDE-ben,
  - Build-time type checking.

### 3.2 Build & Development

#### Vite
- **Verzió:** 4.x vagy 5.x
- **Telepítés:** `npm install --save-dev vite`
- **Config:** `vite.config.ts`
- **Szerep:**
  - Dev server (HMR-rel),
  - TypeScript transpilation,
  - Asset bundling,
  - Production minification.
- **Docs:** https://vitejs.dev

#### Vitest
- **Verzió:** 0.34+
- **Telepítés:** `npm install --save-dev vitest happy-dom`
- **Fájlok:** `*.test.ts` vagy `*.spec.ts`
- **Szerep:**
  - Unit test runner,
  - Gyors feedback loop,
  - Jest-kompatibilis API.
- **Docs:** https://vitest.dev

### 3.3 Linting & Code Quality

#### ESLint + Prettier (opcionális, ajánlott)
- **ESLint:** `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
- **Prettier:** `npm install --save-dev prettier`
- **Szerep:**
  - Kódstílus egységesítés,
  - szintaktikai hibák detektálása.

---

## 4. Projekt mappastruktúra

```
HeroesOfNVVH/
├── .git/
├── .github/
│   └── copilot-instructions.md
├── docs/
│   ├── Architecture.md
│   ├── Decisions.md
│   ├── JatekLeiras.md
│   ├── Tech.md
│   ├── Vizualitas.md
│   ├── conceptart01.svg
│   ├── conceptart02.svg
│   └── concepts/
│       ├── Enemy/
│       └── PSZ/
├── public/
│   ├── assets/
│   │   ├── audio/
│   │   │   ├── effect/
│   │   │   ├── Preparation of hunting.mp3
│   │   │   └── The Hero.mp3
│   │   └── sprites/
│   └── levels/
│       └── level-01.json
├── src/
│   ├── main.ts
│   ├── main.test.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── GameOverScene.ts
│   │   ├── MenuScene.ts
│   │   ├── PlayScene.ts
│   │   ├── PlayScene.test.ts
│   │   └── sceneKeys.ts
│   ├── systems/
│   │   ├── AStarPathfinder.ts
│   │   ├── AStarPathfinder.test.ts
│   │   ├── AttackSystem.ts
│   │   ├── AttackSystem.test.ts
│   │   ├── AudioProfiles.ts
│   │   ├── ICollisionProvider.ts
│   │   ├── AudioSystem.ts
│   │   ├── AudioSystem.test.ts
│   │   ├── GridSystem.ts
│   │   ├── GridSystem.test.ts
│   │   ├── LevelLoader.ts
│   │   ├── LevelLoader.test.ts
│   │   ├── LootSystem.ts
│   │   ├── LootSystem.test.ts
│   │   ├── SimpleCollisionProvider.ts
│   │   └── SimpleCollisionProvider.test.ts
│   ├── types/
│   │   └── level.ts
│   ├── utils/
│   └── ...
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vitest.config.ts
├── package.json
├── README.md
├── CONTRIBUTING.md
└── Tasks.json
```

---

## 5. Pályaformátum (JSON)

A 7×6-os pálya egy custom JSON formátumban tárolódik.

Kapcsolódó döntés ID-k: **D-006, D-007, D-008**.

### 5.1 level01.json szerkezete

```json
{
  "name": "Hatvanpuszta - Reptér",
  "width": 7,
  "height": 6,
  "gridCellSize": 80,
  "spawnPoint": { "gridX": 0, "gridY": 2 },
  "goalPoint": { "gridX": 6, "gridY": 2 },
  "depositPoint": { "gridX": 3, "gridY": 5 },
  "obstacles": [
    { "gridX": 2, "gridY": 1, "type": "car" },
    { "gridX": 4, "gridY": 2, "type": "building" },
    { "gridX": 1, "gridY": 4, "type": "car" }
  ],
  "difficulty": {
    "initialEnemyCount": 2,
    "maxEnemies": 8,
    "spawnInterval": 3000,
    "gameOverThreshold": 10
  }
}
```

### 5.2 Pályageometria

- A rács **7 oszlop × 6 sor**.
- Minden cella: `gridCellSize × gridCellSize` pixel.
- **Trapéz perspektíva:** a felső sori cellák szűkebbek, az alsók szélesebbek (vizuálisan).
- Az **akadályok egy cellát foglalnak el teljesen**.
- A **loot-nak is egy cellája van**.

### 5.3 Kódban való felhasználás

```typescript
// Pálya betöltése
const levelData = await fetch('/maps/level01.json').then(r => r.json());
const gridWidth = levelData.width;      // 7
const gridHeight = levelData.height;    // 6
const obstacles = levelData.obstacles;  // [...]
```

---

## 6. Asset Pipeline

Kapcsolódó döntés ID: **D-012**.

### 6.1 Választott megoldás: Sprite Sheets (PNG/WebP) + TextureAtlas
**Előnyei:**
- Gyors render performance,
- könnyű animálás,
- offline használható.

**Hátrányai:**
- Asset szerkesztés komplexebb,
- nagyobb asset fájlméretek,
- design iteráció lassabb.

**Pipeline:**
1. Illusztrációk készítése (Aseprite, Krita, Photoshop).
2. Sprite sheet exportálás.
3. JSON atlas generálás (TexturePacker vagy saját script).
4. Phaser-be: `textures.fromURL()` vagy asset preload.

**Közelítő költ:** ~10-20 PNG sprite sheet az összes elementhez.

**Miért ez a döntés:**
- Az akciójáték-jelleg miatt gyors, késleltetés nélküli mozgásra és animációra van szükség.
- A játék aktív backend és folyamatos letöltés nélkül is működjön.
- Az előre csomagolt sprite atlas kisebb runtime költséget jelent, mint az SVG runtime feldolgozás.

### 6.2 Nem választott alternatívák

#### Opció B: SVG → Canvas Runtime Rendering
**Előnyei:**
- Vektoralapú, skálázható,
- egyszerűbb szerkesztés iteráció,
- design konzisztencia.

**Hátrányai:**
- Lassabb render (spec. sok animated objekt),
- SVG parse overhead,
- néhány böngésző compat. probléma.

**Pipeline:**
1. SVG-k in `/assets/svgs/`.
2. Runtime: `fetch()` + `fetch().then(r => r.text())`.
3. Canvas-ba rajzolás vagy Pixi/Phaser cache.

**Közelítő költ:** ~8-12 SVG fájl.

### Opció C: Hybrid – SVG Atlasra Renderelés (Build-time)
**Előnyei:**
- SVG rugalmasság + PNG performance,
- batch rendering.

**Hátrányai:**
- Build pipeline komplexebb,
- debug nehezebb.

**Pipeline:**
1. SVG-k szerkesztése.
2. Build-time: SVG → PNG sprite sheet konverzió (`node-canvas` vagy `svg2img`).
3. Phaser atlas-ként.

---

## 7. Audio

Kapcsolódó döntés ID: **D-016**.

### 7.1 Választott megoldás: Phaser audio wrapper mögött
- **Telepítés:** már része a Phaser 3-nak.
- **Formátum:** MP3, OGG, WAV.
- **Fájlok:**
  - `public/assets/audio/Preparation of hunting.mp3` - menüzene
  - `public/assets/audio/The Hero.mp3` - játékon belüli ambient loop
  - `public/assets/audio/effect/Punch01.mp3` - támadás SFX
  - `public/assets/audio/effect/death01.mp3` ... `death04.mp3` - halál SFX variációk

Az MVP-ben a rövid effektusokhoz fallback synth hang is tartozhat, ha a betöltött audio nem érhető el.

**Miért ez a döntés:**
- az MVP hangigénye egyszerű,
- nincs szükség külön audio dependency-re induláskor,
- jól illeszkedik a Phaser scene-alapú architektúrához.

### 7.2 Audio architektúra

Az audio kezelést nem közvetlenül a Phaser scene-ekbe kell írni, hanem egy cserélhető szolgáltatás mögé.

```typescript
export interface IAudioService {
  playSfx(key: string): void;
  playMusic(key: string, loop?: boolean): void;
  fadeOutMusic(durationMs?: number, onComplete?: () => void): void;
  stopMusic(): void;
  setMasterVolume(value: number): void;
  setMuted(muted: boolean): void;
  setMusicMuted(muted: boolean): void;
  setSfxMuted(muted: boolean): void;
}
```

Első implementáció:
- `PhaserAudioService`

Jelenlegi használat:
- a `BootScene` preloadolja a fő zenei és effekt asseteket,
- a `MenuScene` és a `PlayScene` külön zene/SFX némítási kapcsolót használ,
- a beállítások Phaser registry-n keresztül maradnak meg a scene-ek között.

Lehetséges későbbi csere:
- `HowlerAudioService`

Így a játékmeneti logika és a UI nem kötődik közvetlenül a Phaser audio API-hoz.

### 7.3 Alternatíva: Howler.js
- Csak akkor szükséges, ha később bonyolultabb hangkezelés vagy kompatibilitási probléma merül fel.
- `npm install howler`.

---

## 8. Állapot és perzisztencia

### LocalStorage
- **High score mentése:** `localStorage.setItem('heroNVVH_highScore', JSON.stringify(scores))`
- **Beállítások:** hang, nyelv, etc.
- **Méret:** ~5-50 KB elegendő.

### SessionStorage (opcionális)
- Aktív game state (ha nincs mentés funkció).
- Böngésző bezárásánál elvész.

### Phaser GameState plugin
- Custom event system a Phaser-ben.
- Könnyű observer pattern implementáció.

---

## 8.5 Collision architektúra

Kapcsolódó döntés ID: **D-014**.

A választott megoldás egy **saját rectangle-alapú collision detection**, de nem közvetlenül a scene-ekbe drótozva, hanem cserélhető szolgáltatásként.

### Cél
- MVP-ben egyszerű és átlátható implementáció,
- később lecserélhető legyen más megoldásra,
- a játékmeneti logika ne függjön közvetlenül Phaser physics API-tól.

### Javasolt szerkezet

```typescript
export interface ICollisionProvider {
  overlaps(a: Rect, b: Rect): boolean;
  collidesWithObstacles(rect: Rect, obstacles: Rect[]): boolean;
  queryLootPickup(playerRect: Rect, lootRects: Rect[]): number[];
  queryZoneOverlap(rect: Rect, zones: Rect[]): string[];
}
```

Első implementáció:
- `SimpleCollisionProvider`
- axis-aligned rectangle overlap ellenőrzések
- külön kezelés player / enemy / loot / zóna típusokra

Későbbi lehetséges csere:
- `PhaserArcadeCollisionProvider`
- azonos interfészt megvalósítva

Így a `GameScene`, `Player`, `EnemyManager` és más rendszerek nem a konkrét collision motorhoz kötődnek, hanem csak az interfészhez.

---

## 9. Build és Deploy

### 9.1 Vite Build

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build lokálisan
npm run preview
```

### 9.2 GitHub Pages Deploy

Kapcsolódó döntés ID-k: **D-005, D-018**.

Az `vite.config.ts`-ben:
```typescript
export default defineConfig({
  base: '/HeroOfNVVH/',  // Repository neve
  build: {
    outDir: 'dist',
  }
})
```

Workflow (GitHub Actions):
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Ez automatikus deploy-t csinál minden `main` branch push-ra.

---

## 10. NPM Scripts (ajánlott)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext ts",
    "lint:fix": "eslint src --ext ts --fix",
    "format": "prettier --write src",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 11. Tesztelési stratégia

### 11.1 Unit Teszt (Vitest)

```typescript
// tests/unit/GridUtils.test.ts
import { describe, it, expect } from 'vitest';
import { gridToPixel, pixelToGrid } from '@/utils/GridUtils';

describe('GridUtils', () => {
  it('converts grid (0,0) to pixel (40, 40)', () => {
    const pixel = gridToPixel(0, 0, 80);
    expect(pixel).toEqual({ x: 40, y: 40 });
  });
});
```

### 11.2 Integration Teszt

```typescript
// tests/integration/Game.test.ts
describe('Game Scene', () => {
  it('loads level01.json and spawns obstacles', async () => {
    // Phaser game instance, scene test
  });
});
```

### 11.3 E2E (opcionális MVP után)

- **Tool:** Playwright vagy Cypress.
- **Cél:** Teljes játékmenetet szimulálni.

---

## 12. TypeScript Config

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 13. Fejlesztési workflow

### 13.1 Egy-egy feature fejlesztése

```bash
# 1. Feature branch
git checkout -b feature/player-movement

# 2. Dev server indítása
npm run dev

# 3. Teszt írása
npm test

# 4. Kód: src/objects/Player.ts, stb.

# 5. Build tesztelés
npm run build
npm run preview

# 6. Commit
git add .
git commit -m "Add player movement with grid-based pathfinding"

# 7. Push és PR
git push origin feature/player-movement
# GitHub PR

# 8. Merge main-ba
```

### 13.2 Release / Deployment

```bash
# main branch-en
npm run build
# GitHub Actions automatikusan deployol GitHub Pages-re
```

---

## 14. Dependenciák összefoglalása

### Runtime
- **phaser** (3.55+)

### Dev
- **typescript** (4.9+)
- **vite** (4.x vagy 5.x)
- **vitest** (0.34+)
- **happy-dom** (vitest-hez)
- **@typescript-eslint/parser**, **@typescript-eslint/eslint-plugin** (opcionális)
- **prettier** (opcionális)

### Optional (későbbi iteráció)
- **howler** (audio fallback)
- **gsap** (animation tween library)
- **lodash** (utility functions)

---

## 15. Installer Scripts

### 15.1 Projekt inicializálása

```bash
# 1. Node.js telepítve van-e?
node --version

# 2. Új projekt (vagy meglévőbe)
git clone https://github.com/szakyster/HeroOfNVVH.git
cd HeroOfNVVH

# 3. Dependencies install
npm install

# 4. Dev server start
npm run dev

# Browser: http://localhost:5173
```

### 15.2 Új csapattag onboarding

```bash
git clone https://github.com/szakyster/HeroOfNVVH.git
cd HeroOfNVVH
npm install
npm run dev
# Vagy: npm test
```

---

## 16. Environment Variables (opcionális)

Ha szükséges:
```bash
# .env
VITE_API_URL=https://api.example.com
VITE_DEBUG=false
VITE_VERSION=0.1.0
```

Vite-ban:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 17. Közelítő projekt timeline

| Fázis | Tartalom | Becsült idő |
|-------|----------|-----------|
| **Setup** | Vite, TS, Phaser init, dummy scene | 1-2 nap |
| **MVP Core** | Pálya render, játékos, ellenség, loot, HUD | 3-4 nap |
| **Gameplay** | Input, ütés, collision, pont | 2-3 nap |
| **Polish** | Animáció, SFX, UI | 2-3 nap |
| **Testing** | Unit + E2E | 1-2 nap |
| **Deploy** | GitHub Pages, GitHub Actions | 1 nap |
| **Dokumentáció** | Code comments, API docs | 1 nap |

**Összes:** ~2-3 hét full-time egy fejlesztőnél.

---

## 18. További technikai megjegyzések

- A játék statikus fájlkiszolgálással futtatható.
- Nincs szükség aktív backend folyamatra.
- Nem készül service worker vagy PWA offline réteg az első verzióhoz.

---

## 19. Hivatkozások

- [Phaser 3 Documentation](https://phaser.io/docs/3.55)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

---

## 20. Összefoglalás

Ez a tech spec egy **gyors, modern, TypeScript-alapú Phaser 3 arcade játék** fejlesztésére készül, amely:

- **Vite-tal** buildelhető és deployható,
- **Vitest-tel** tesztelhető,
- **GitHub Pages-en** hostelható,
- **moduláris, skálázható** kódstruktúrával rendelkezik.

A specifikáció rugalmas marad azáltal, hogy több asset pipeline lehetőséget enged meg, és később könnyű bővítésre alkalmas (további librarykat, toolokat lehet hozzáadni).

**Ajánlott kezdő lépés:** Phaser 3 + Vite projekt template elkészítése, pálya betöltés és alapvető sprite rajzolás.
