# Heroes of NVVH – Art Direction és AI Asset Pipeline

## 1. Cél

Ez a dokumentum rögzíti a design gyártás operatív szabályait a Heroes of NVVH következő vizuális szakaszához.

A cél:
- egységes AI-val támogatott assetgyártás,
- stabil vizuális stílus taskokon át,
- gameplay szempontból jól olvasható képi elemek,
- olyan export formátumok, amelyeket később Phaserben könnyű integrálni.

Ez a dokumentum a [Vizualitas](docs/Vizualitas.md) art directionjét fordítja át konkrét gyártási szabályokra.

## 2. Alapelvek

- A játék képe maradjon egy pillantásra olvasható.
- A humoros, arcade-szerű hangulat fontosabb a részletgazdag realizmusnál.
- A kamera és a nézőpont nem változhat assetenként.
- A játékos, az ellenség, a loot és az interaktív pontok mindig vizuálisan elkülönüljenek.
- A háttér és a UI soha nem veheti el a figyelmet a gameplay-elemekről.

## 3. Asset kategóriák

### 3.1 Háttérgrafikák
Statikus vagy minimálisan rétegzett képek az egyes scene-ekhez.

Ide tartozik:
- Menu háttér
- Play háttér hangulati rétegei
- Leaderboard háttér
- Game Over háttér

Kimenet:
- széles háttérkép vagy rétegelt PNG/WebP
- nem sprite sheet

### 3.2 Környezeti elemek
A játéktéren vagy a pálya mellett elhelyezett statikus elemek.

Ide tartozik:
- Hatvanpuszta
- Reptér
- NVVH székház
- akadályok
- sanctuary/deposit vizuális elemek
- pálya burkolata és díszletei

Kimenet:
- egyedi PNG/WebP elemek vagy kisebb atlas-csomagok

### 3.3 Interaktív propok és loot
Kisebb gameplay-objektumok, amelyeknek kis méretben is olvashatónak kell maradniuk.

Ide tartozik:
- pénz / arany / értéktárgy lootok
- pickup és deposit vizuális elemek
- kisebb interaktív marker-elemek

Kimenet:
- tiszta kontúros PNG/WebP
- szükség esetén közös atlas

### 3.4 Karakterek
A főhős és az ellenségek végleges vizuális tervei és animációs forrásai.

Jelenlegi referencia:
- a főhős elsődleges vizuális kiindulópontja a `docs/concepts/PSZ/PSZ01.png`
- új főhős-iteráció csak ennek tudatos továbbfejlesztése legyen, ne teljes stílusváltás

Kimenet:
- karakter turnarounds vagy state sheet
- később sprite sheet / texture atlas

### 3.5 UI elemek
Nem a környezet részei, külön vizuális rendszerként kezelendők.

Ide tartozik:
- HUD panelek
- hátizsák megjelenítés
- gombok
- ikonok
- leaderboard panelek
- némítási kapcsolók és más UI vezérlők

Kimenet:
- külön UI atlas vagy jól szeletelhető PNG elemek

## 4. Kamera és nézőpont szabályok

- A PlayScene összes pályaeleme ugyanazt a fix, enyhén döntött 2.5D nézőpontot használja.
- A trapéz rácshatás a pálya alapstruktúrájából jön, nem változó kamerából.
- A karakterek mérete fix marad, nem skálázódik mélység szerint.
- A landmarkok a pályán kívül vannak, de vizuálisan kapcsolódnak hozzá.
- UI elemeket soha nem ebben a perspektívában kell generálni.

## 5. Színrendszer

### 5.1 Környezet
- aszfaltos, szürkés, tompább alapok
- visszafogott zöldes vagy kékes másodlagos hangulati tónusok
- a háttér mindig kevésbé telített, mint a gameplay-elemek

### 5.2 Játékos
- élénk, meleg főszín
- a háttérből azonnal kiemelkedő tónus

### 5.3 Ellenségek
- a játékostól egyértelműen eltérő másodlagos színvilág
- tömegben is gyorsan felismerhető sziluett és tónus

### 5.4 Loot
- hangsúlyos, fényesebb, telítettebb színek
- környezeti elemekkel nem keverhető tónusok

### 5.5 UI
- kontrasztos, tiszta, vastag körvonalas rendszer
- olvashatóság elsődleges a díszítéssel szemben

## 6. AI promptolási szabályok

### 6.1 Kötelező prompt-elemek
Minden generálásnál szerepeljen:
- humoros arcade game art
- readable silhouette
- fixed 2.5D perspective
- slightly tilted top-down / side-view hybrid
- stylized city environment
- clean outlines
- low clutter
- readable at small size

### 6.2 Tiltólista
Negatív prompt vagy manuális szűrés szintjén kerülendő:
- photorealistic
- cinematic depth of field
- dramatic perspective shift
- ultra detailed texture noise
- dark gritty realism
- tiny unreadable details
- inconsistent lighting direction
- inconsistent line thickness
- UI-like overlays baked into gameplay assets

### 6.3 Prompt-sablon háttérelemekhez
`stylized arcade game environment, fixed 2.5D perspective, humorous city setting, clean readable shapes, low clutter, strong silhouette separation, gameplay-first composition, muted background palette, no photorealism`

### 6.4 Prompt-sablon karakterekhez
`stylized but readable human character for arcade game, fixed 2.5D gameplay view, recognizable face and body shape, clean silhouette, light humorous tone, readable at small scale, no photorealism, no cinematic camera`

### 6.5 Karakter-iterációs szabály
- ha a főhős újragenerálása történik, a prompt induljon a `PSZ01` referencia megtartásával
- a sziluett, testarány, általános karakterenergia és felismerhetőség maradjon konzisztens
- egyszerre csak egy nagy változó módosuljon: ruha, színrendszer, arc, póz vagy nézőpont
- a jóváhagyott referencia elvesztése nélkül kell finomítani, nem nulláról újratervezni minden körben

### 6.6 Prompt-sablon UI-hoz
`arcade game UI panel, bold readable iconography, thick outlines, clean graphic shapes, colorful but controlled palette, high contrast, no realistic texture, no perspective distortion`

## 7. Export szabályok

### 7.1 Általános
- Végleges runtime asset: PNG vagy WebP
- Átlátszó háttér, ha az elem nem teljes jelenetháttér
- Ne maradjon benne AI watermark, generált felirat vagy véletlen UI-részlet

### 7.2 Háttérképek
- célfelbontás: legalább 1920×1080
- komponáláskor a 1024×768 gameplay nézetet kell elsődleges safe area-ként kezelni

### 7.3 Játéktéri objektumok
- export úgy készüljön, hogy 1024×768-as játéktérben is tisztán olvasható legyen
- egy assethez tartozzon egységes padding és igazítási logika

### 7.4 Karakterek és animáció
- minden state azonos nézőponttal készüljön
- animációs frame-ek azonos testarányokat és fényirányt használjanak
- végleges integrációhoz sprite sheet vagy texture atlas formátum preferált

### 7.5 UI
- preferáltan szeletelhető, tiszta, külön elemekből álló készlet
- a feliratok lehetőleg ne legyenek beleégetve a grafikai alapba, ha kódból is frissülhetnek

## 8. Fájlelnevezés

### 8.1 Háttér
- `scene-menu-bg-v01.png`
- `scene-play-bg-v01.png`

### 8.2 Környezet
- `env-hatvanpuszta-v01.png`
- `env-airport-v01.png`
- `env-nvvh-hq-v01.png`
- `obstacle-car-red-v01.png`

### 8.3 Loot
- `loot-cash-v01.png`
- `loot-gold-v01.png`
- `loot-luxury-item-v01.png`

### 8.4 Karakterek
- `hero-idle-sheet-v01.png`
- `enemy-run-sheet-v01.png`

### 8.5 UI
- `ui-hud-panel-v01.png`
- `ui-backpack-slot-v01.png`
- `ui-audio-toggle-v01.png`

## 9. Minőségi kapuk

Egy asset akkor fogadható el, ha:
- illeszkedik a rögzített nézőponthoz,
- kis méretben is olvasható,
- nem keverhető össze más gameplay-kategóriával,
- ugyanabba a vizuális családba tartozik, mint a többi elfogadott asset,
- technikailag exportálható a választott runtime formátumba.

## 10. Első task outputjai

A 14-es task akkor tekinthető késznek, ha megvan:
- ez az AI pipeline szabályrendszer,
- a végleges assetkategória-bontás,
- a prompt- és tiltólista-alap,
- a jóváhagyott kiinduló karakterreferencia rögzítése,
- az export- és fájlelnevezési séma,
- a következő design taskok számára használható egységes kiindulópont.