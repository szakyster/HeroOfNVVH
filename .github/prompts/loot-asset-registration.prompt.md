---
name: "Loot Asset Registration"
description: "Register a new loot image in the HeroesOfNVVH loot asset registry and update related validation/tests"
argument-hint: "Add meg a loot képfájl nevét, és opcionálisan azt is, hogy frissüljön-e a level JSON minta"
agent: "agent"
model: "GPT-5 (copilot)"
---

Regisztrálj egy új loot képet a HeroesOfNVVH projekt loot asset rendszerében.

Ezt a promptot akkor használd, amikor egy új fájl került a `public/assets/loots/` mappába, és azt használhatóvá kell tenni a játékban a loot registryn, a loader validáción és szükség esetén a pályafájl mintán keresztül.

Végrehajtási cél:

1. Az új loot kép legyen felvéve a loot asset registry-be.
2. A `LevelLoader` validáció fogadja el a fájlnevet a `lootSpawns[].image` mezőben.
3. A kapcsolódó tesztek frissüljenek.
4. Ha a felhasználó kéri, a `public/levels/level-01.json` is használja az új képet mintaként.

Végrehajtási szabályok:

- Először ellenőrizd, hogy a megadott fájl valóban létezik-e a `public/assets/loots/` mappában.
- A loot registry fő helye: [LootAssets.ts](../../src/systems/LootAssets.ts).
- A loot JSON validáció fő helye: [LevelLoader.ts](../../src/systems/LevelLoader.ts).
- A típusrendszer fő helye: [level.ts](../../src/types/level.ts).
- A Play scene loot renderelése jelenleg a loot registry kulcsait használja, ezért csak a registry és a validáció konzisztenciáját kell fenntartani.
- Ha van hozzá kapcsolódó teszt, frissítsd vagy bővítsd.
- Ne refaktorálj nem kapcsolódó részeket.
- Ha a fájl nem létezik a `public/assets/loots/` mappában, állj meg és írd le pontosan, mi hiányzik.

Ajánlott lépéssor:

1. Ellenőrizd a megadott loot képfájlt a `public/assets/loots/` mappában.
2. Vedd fel a képet a loot asset registry-be a [LootAssets.ts](../../src/systems/LootAssets.ts) fájlban.
3. Frissítsd a loot asset tesztet a [LootAssets.test.ts](../../src/systems/LootAssets.test.ts) fájlban.
4. Ha szükséges, ellenőrizd vagy frissítsd a loot image validációt a [LevelLoader.ts](../../src/systems/LevelLoader.ts) fájlban és a [LevelLoader.test.ts](../../src/systems/LevelLoader.test.ts) fájlban.
5. Ha a felhasználó ezt külön kéri, módosítsd a [level-01.json](../../public/levels/level-01.json) loot bejegyzéseit az új fájl használatára.
6. Futtasd a releváns teszteket.
   Ajánlott parancs: `npx vitest run src/systems/LootAssets.test.ts src/systems/LevelLoader.test.ts src/scenes/PlayScene.test.ts`
7. A végén röviden jelezd:
   - melyik fájlt regisztráltad,
   - mely fájlok frissültek,
   - lefutottak-e a releváns tesztek,
   - frissült-e a `level-01.json`.

Hasznos kontextus:

- [Projekt instrukciók](../copilot-instructions.md)
- [CP prompt](./cp.prompt.md)