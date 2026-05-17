# Heroes of NVVH – döntési napló

Ez a dokumentum csak azokat a pontokat tartalmazza, amelyekben már megszületett a döntés.

---

## D-001 – Játékmotor
- **Döntés:** `Phaser 3`
- **Státusz:** elfogadva
- **Indoklás:** Teljes 2D megoldás, gyors prototipizálás, scene-kezelés, input, animáció és audio támogatás.

## D-002 – Programozási nyelv
- **Döntés:** `TypeScript`
- **Státusz:** elfogadva
- **Indoklás:** Típusbiztonság, jobb karbantarthatóság, jobb IDE támogatás.

## D-003 – Build rendszer
- **Döntés:** `Vite`
- **Státusz:** elfogadva
- **Indoklás:** Gyors fejlesztői környezet, egyszerű build és preview folyamat.

## D-004 – Teszt keretrendszer
- **Döntés:** `Vitest`
- **Státusz:** elfogadva
- **Indoklás:** Jól illeszkedik a Vite-hoz, gyors és egyszerűen használható.

## D-005 – Deploy cél
- **Döntés:** `GitHub Pages`
- **Státusz:** elfogadva
- **Indoklás:** Egyszerű, ingyenes, közvetlenül illeszkedik a GitHub repóhoz.

## D-006 – Pályatárolás
- **Döntés:** saját `JSON` formátum
- **Státusz:** elfogadva
- **Indoklás:** Egyszerű, könnyen szerkeszthető és közvetlenül illeszthető a játéklogikához.

## D-007 – Pálya rácsmodellje
- **Döntés:** 7×6-os rács, vizuálisan trapéz perspektívával
- **Státusz:** elfogadva
- **Indoklás:** Támogatja a 2.5D, enyhén oldalnézetes hatást, miközben a logika egyszerű 2D marad.

## D-008 – Objektumok rácshasználata
- **Döntés:** az akadályok és a loot egy-egy konkrét rácskockához kötődnek
- **Státusz:** elfogadva
- **Indoklás:** Egyszerűbb pályaolvasás, egyértelmű ütközésdetekció és könnyebb implementáció.

## D-009 – Kamera
- **Döntés:** fix kamera, a teljes pálya egyszerre látható
- **Státusz:** elfogadva
- **Indoklás:** Egyszerűbb UX, egyszerűbb technikai megvalósítás, jobb arcade-érzet.

## D-010 – HUD kötelező elemei
- **Döntés:** a HUD-on látszódjon a pontszám, hátizsák-kapacitás, elszökött ellenségek száma, valamint opcionálisan idő vagy nehézségi szint
- **Státusz:** elfogadva
- **Indoklás:** Ezek az alapvető, játék közben folyamatosan szükséges információk.

## D-011 – Koncept-art fájlnév minta
- **Döntés:** `conceptart01.svg`, `conceptart02.svg`, ...
- **Státusz:** elfogadva
- **Indoklás:** Egységes és bővíthető fájlelnevezés.

## D-012 – Asset pipeline
- **Döntés:** `Sprite sheets (PNG/WebP) + TextureAtlas`
- **Státusz:** elfogadva
- **Indoklás:** Akciójátékhoz gyors, alacsony késleltetésű renderelés és animáció szükséges. Emellett a játék aktív backend és folyamatos letöltés nélkül kell működjön, ezért az előre csomagolt, lokálisan betölthető sprite atlas a legpraktikusabb megoldás.

## D-013 – Pathfinding algoritmus
- **Döntés:** saját `A*` algoritmus
- **Státusz:** elfogadva
- **Indoklás:** A pálya kicsi és fix (7×6), az útvonalat csak induláskor kell kiszámolni, ezért egy egyszerű saját A* implementáció elég, és nem szükséges hozzá külön külső library.

## D-014 – Collision detection
- **Döntés:** saját `collision detection`, cserélhető architektúrával
- **Státusz:** elfogadva
- **Indoklás:** A játékhoz elegendő az egyszerű, rectangle-alapú ütközéskezelés. Ugyanakkor a megoldást úgy kell szervezni, hogy később lecserélhető legyen például Phaser Arcade Physics alapú implementációra, a felsőbb játékmeneti logika módosítása nélkül.

## D-015 – Lokalizáció
- **Döntés:** kizárólag magyar nyelvű UI és tartalom
- **Státusz:** elfogadva
- **Indoklás:** A projekt célja egy csak magyar nyelvű játék, és ez később sem fog változni, ezért nincs szükség többnyelvű architektúra vagy i18n réteg előkészítésére.

## D-016 – Audio rendszer
- **Döntés:** Phaser beépített audio, cserélhető wrapper rétegen keresztül
- **Státusz:** elfogadva
- **Indoklás:** Az MVP-hez várható hangigény egyszerű, ezért a Phaser audio elegendő. Ugyanakkor a hangkezelést szolgáltatásrétegen keresztül kell szervezni, hogy később szükség esetén lecserélhető legyen például `Howler.js` alapú implementációra.

## D-017 – Telemetria
- **Döntés:** nem lesz telemetria
- **Státusz:** elfogadva
- **Indoklás:** A projekt céljához nincs szükség játékhasználati analitikára, ezért nem kerül bevezetésre sem kliensoldali eseménygyűjtés, sem külső analytics szolgáltatás.

## D-018 – PWA és offline támogatás
- **Döntés:** egyelőre nem lesz PWA-szintű offline támogatás
- **Státusz:** elfogadva
- **Indoklás:** A játék statikus fájlkiszolgálással fusson, aktív háttérfolyamatok, service worker és PWA-funkciók nélkül. A működéshez nincs szükség aktív backend logikára, de külön offline-first réteg sem készül.

## D-019 – PlayScene bontási stratégia
- **Döntés:** a `PlayScene` vékony orchestrator maradjon, és a scene-közeli részfelelősségek külön helper modulokba kerüljenek a `src/scenes/playScene/` mappában.
- **Státusz:** elfogadva
- **Indoklás:** A jelenet túl nagyra nőtt egyetlen fájlban. A HUD, world, spawning, enemy, combat, loot, hero, player timing és effects logika különválasztása javítja a tesztelhetőséget és a karbantarthatóságot, miközben a Phaser scene-flow változatlan marad.

## D-020 – Egyszeri tesztfuttatás külön scriptből
- **Döntés:** a teljes, egyszeri tesztfuttatás standard parancsa `npm run test:run`.
- **Státusz:** elfogadva
- **Indoklás:** A `npm run test` watch módra nyit, ami fejlesztés közben hasznos, de tasklezárásnál és determinisztikus ellenőrzésnél külön, egyszer lefutó parancs szükséges.

## D-021 – Ellenséganimációk több sprite-sheet családból
- **Döntés:** az ellenségek vizuális variánsai külön sprite-sheet családokból (`enemy01`-`enemy04`) töltődnek be, és spawnoláskor ciklikusan váltakoznak.
- **Státusz:** elfogadva
- **Indoklás:** A több enemy-variáns növeli a vizuális változatosságot anélkül, hogy külön játékszabály-rendszerre lenne szükség. A mozgás- és sérülésanimációk azonos technikai pipeline-t követnek, ezért egyszerűen illeszthetők a meglévő rendszerbe.

---

## Nyitott megjegyzés
Azok a pontok, amelyekben még nincs döntés, **nem ebbe a fájlba kerülnek**, hanem a megfelelő specifikációs dokumentumokban maradnak nyitott kérdésként.
