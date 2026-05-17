# Heroes of NVVH – játékleírás

## 1. Áttekintés

A játék egy egyszerű, gyors, mobiljáték-hangulatú, HTML-alapú 2.5D akciójáték, amely asztali böngészőben fut.

A játékos egy főszereplőt irányít egy fix méretű, téglalap alakú pályán. A pályán három kiemelt pont található:

1. **Hatvanpuszta** – az ellenségek innen indulnak.
2. **Reptér** – ha túl sok ellenség ide eljut, a játék véget ér.
3. **NVVH** – ide kell a játékosnak visszajuttatnia a megszerzett értékeket.

A játékmenet alapja:
- az ellenségek elindulnak Hatvanpusztáról a reptér felé,
- a játékos megpróbálja őket utolérni és megütni,
- az ellenség találat esetén értéket dob el,
- a játékos felveheti az értékeket,
- majd az NVVH pontra eljutva leadhatja őket pontokért.

A cél egy könnyen tanulható, egyszerű, jól olvasható, gyors játékélmény létrehozása.

---

## 2. Játékcél és győzelmi / vereségi feltételek

## 2.1 Játékos célja
A játékos célja minél több értéket visszaszerezni és azokat eljuttatni az NVVH-hoz, miközben megakadályozza, hogy túl sok ellenség elérje a repteret.

## 2.2 Vereségi feltétel
A játék véget ér, ha egy előre meghatározott számú ellenség eljut a reptérre.

## 2.3 Pontszerzés
A pontok nem az érték felvételéért, hanem a sikeres **leadásért** járnak az NVVH ponton.

Ez arra ösztönzi a játékost, hogy:
- ne csak üldözze az ellenséget,
- hanem kockázatot vállalva mozogjon a pályán,
- és időben visszavigye a megszerzett értékeket.

---

## 3. Platform és technikai alapelvek

- **Platform:** asztali böngésző
- **Nézet:** 2.5D, fix kamera
- **Pálya:** egyetlen fix méretű pálya
- **Stílus:** rajzfilmszerű, egyszerűen olvasható grafika
- **Játékmenet:** arcade jellegű, rövid reakcióidővel, egyszerű szabályokkal
- **Célérzet:** mobiljáték-hangulat, de böngészőben futtatva

A fix kamera miatt a játékteret egyszerre látja a játékos, ezért a kezelhetőség egyszerű marad, a taktikai döntések pedig gyorsan meghozhatók.

---

## 4. Pálya és térbeli modell

## 4.1 Pálya felépítése
A pálya egy fix, téglalap alakú terület.

Ezen belül helyezkednek el:
- a három fő pont:
  - Hatvanpuszta,
  - Reptér,
  - NVVH,
- valamint néhány statikus tereptárgy / akadály.

## 4.2 Mozgástér
A karakterek egy sík 2D területen mozognak négy irányban:
- balra,
- jobbra,
- fel,
- le.

A vizuális megjelenés 2.5D jellegű, de a logika felülnézeti 2D mozgásként kezelhető.

## 4.3 Rácsalapú logika
A pálya háttérben rácsosítva van.

A rács célja:
- akadályok kezelése,
- ellenségútvonalak számítása,
- egyszerűsített navigáció.

Minden cella kétféle lehet:
- **járható**,
- **nem járható**.

Az akadályok által elfoglalt cellák nem járhatók sem a játékos, sem az ellenségek számára.

## 4.4 Akadályok
Az akadályok statikusak, nem mozdulnak el, nem rombolhatók.

Feladatuk:
- tagolják a pályát,
- befolyásolják az ellenségek útvonalát,
- érdekesebb mozgási döntésekre kényszerítik a játékost.

---

## 5. Fő játékelemek

## 5.1 Játékos karakter
A játékos egyetlen főszereplőt irányít.

Tulajdonságai:
- szabad mozgás a járható területen,
- közelharci támadás,
- legfeljebb 4 darab érték cipelése,
- értékek leadása az NVVH ponton.

A játékos feladatai:
- ellenségek elfogása,
- ellenségek megütése,
- loot felvétele,
- loot leadása.

A játékoshoz kapcsolódó state-prioritás a következő:
- kötelező: **várakozik**, **fut**, **támad**,
- opcionális: **begyűjt**, **lead**.

## 5.2 Ellenségek
Az ellenségek Hatvanpusztáról indulnak és megpróbálnak eljutni a reptérre.

Tulajdonságaik:
- induláskor kapnak egy útvonalat,
- az útvonal a start és a cél között jön létre,
- az útvonal figyelembe veszi az akadályokat és a rácskockás elrendezést,
- **az akadályok egy-egy rácskockát foglalnak el teljesen**, így az útkeresés ezeket blokkolva kerüli,
- menet közben az útvonal nem változik,
- 2 életerővel indulnak,
- találatkor az életerejük csökken,
- ha marad életük, teljes sérülésanimációt játszanak le és csak utána folytatják a mozgást,
- ha az életerő nullára csökken, eltűnnek.

Jelenleg több vizuális enemy-variáns van használatban, amelyek azonos játékszabályokkal, de eltérő walk/sérülés sprite sheet-ekkel jelennek meg.

Az ellenségek mozgása egyszerű és jól olvasható kell legyen, nem szükséges fejlett mesterséges intelligencia.

Az ellenségekhez kapcsolódó state-prioritás a következő:
- kötelező: **mozog**, **sérül**,
- opcionális, csökkenő valószínűségi vagy megvalósítási prioritási sorrendben: **spawnolódik**, **meghal**, **eléri a célt**.

## 5.3 Értékek / loot
A loot reprezentálhat különféle vagyontárgyakat, például:
- pénz,
- arany,
- luxusautó,
- egyéb érték.

A loot jellemzői:
- ellenség megütésekor esik egy konkrét rácskockába,
- **egy-egy loot-érték egy rácskockát foglal el**,
- a pályán korlátozott ideig marad,
- 5 másodperc után eltűnik,
- eltűnés előtt villogással jelez,
- a játékos érintéssel felveszi.

Fontos: a loot és az akadályok rácskocka-alapú elhelyezése világos ütközésdetekciót és pályaolvashatóságot biztosít.

## 5.4 NVVH leadási pont
Az NVVH a leadási zóna.

Ha a játékos értéket hord magán, és belép az NVVH területére:
- a nála lévő összes érték leadásra kerül,
- a rendszer pontokat ír jóvá,
- a játékos hátizsákja kiürül.

## 5.5 Reptér
A reptér az ellenség célpontja.

Ha egy ellenség eléri:
- az adott ellenség sikeresen megszökik,
- növekszik az elszökött ellenségek száma,
- a rendszer ellenőrzi a vereségi feltételt.

---

## 6. Játékmenet részletesen

## 6.1 Alap körfolyamat
A játék fő ciklusa a következő:

1. ellenség jelenik meg Hatvanpusztán,
2. elindul a reptér felé,
3. a játékos üldözi,
4. a játékos támad,
5. az első túlélő találat után az ellenség lootot dob,
6. a játékos felveszi a lootot,
7. a játékos elviszi az NVVH-hoz,
8. pontot kap,
9. közben újabb ellenségek érkeznek.

## 6.2 Támadás
A támadás egyszerű közelharci akció.

Elvárások:
- legyen rövid támadó animáció,
- legyen vizuális találati visszajelzés,
- a hitbox legyen egyszerű, nagyvonalú, oversize téglalap,
- ne kelljen pixelpontos ütközés.

A támadás célja, hogy könnyen érthető és megbocsátó legyen.

## 6.3 Sebzés és ellenség eltűnése
Az ellenség 2 találatot bír ki.

Példa állapotok:
- mozog: alap, kötelező gameplay state,
- sérül: kötelező visszajelzési state első találat után,
- meghal: opcionális lezáró state a második találat után,
- eléri a célt: opcionális sikeres megszökés state,
- spawnolódik: opcionális belépési state az ellenség megjelenésekor.

Az a találat, amely nullára viszi az életerőt, azonnal leveszi az ellenséget a pályáról.

## 6.4 Loot időzítés
A loot a földön csak korlátozott ideig marad.

Időzítés:
- teljes élettartam: 5 másodperc,
- az utolsó szakaszban villog,
- majd eltűnik.

Ez tempót ad a játéknak, és döntésre kényszeríti a játékost:
- üldözze tovább az ellenséget,
- vagy menjen vissza a lootért.

## 6.5 Hátizsák limit
A játékos legfeljebb 4 lootot vihet magával.

Ha a hátizsák tele van:
- további lootot nem tud felvenni,
- ezért előbb le kell adnia a nála lévőket.

Ez egyszerű, de hatékony kockázat-kezelési mechanika.

## 6.6 Nehézség növelése
Az idő múlásával fokozatosan nő a játék nehézsége.

Növelhető paraméterek:
- egyszerre aktív ellenségek száma,
- új ellenségek érkezési gyakorisága,
- ellenségek mozgási sebessége.

A jelenlegi implementáció hullámokban működik: az ellenségek egy időablakon belül, enyhe véletlen eltolással spawnolnak, majd a következő hullám több enemy-t engedhet be.

Más komplex skálázás nem szükséges.

---

## 7. Ellenség útvonaltervezése

## 7.1 Alapelv
Minden ellenség induláskor kap egy teljes útvonalat Hatvanpuszta és a reptér között.

Az útvonal:
- véletlenszerűnek hasson,
- de garantáltan kerülje ki az akadályokat,
- menet közben ne változzon.

## 7.2 Javasolt működés
A pálya rácsosított modelljén történik az útkeresés.

Javasolt módszer:
- A* vagy hasonló útkeresés,
- enyhe véletlenszerű zajjal / alternatív súlyozással,
- hogy ne minden ellenség ugyanazon az útvonalon menjen.

Az eredmény egy waypoint-sorozat, amelyet az ellenség követ.

## 7.3 Miért jó ez
Előnyei:
- egyszerű implementáció,
- jól kontrollálható,
- olcsó futás közben,
- mobiljáték-jellegű egyszerűség,
- kevés hibalehetőség.

---

## 8. Vizuális és UX alapelvek

## 8.1 Vizuális stílus
- rajzfilmszerű karakterek,
- erős körvonalak,
- tiszta sziluettek,
- egyszerű háttérelemek,
- könnyen felismerhető célpontok.

## 8.2 Olvashatóság
A játékosnak mindig látnia kell:
- hol vannak az ellenségek,
- mi a loot,
- mennyi szabad hely van a hátizsákban,
- hol van az NVVH,
- mennyi ellenség jutott el a reptérre.

## 8.3 Visszajelzések
Fontos visszajelzések:
- ütés animáció,
- találat effekt,
- loot felvételi effekt,
- leadási effekt,
- loot villogása eltűnés előtt,
- game over képernyő.

---

## 9. Felhasználói felület és ablakok

A játékhoz több egyszerű felületi ablak / képernyő tartozik.

## 9.1 Nyitóablak
A nyitóablak a játék első képernyője.

Tartalma:
- játék címe,
- Start gomb,
- Help gomb,
- Eredménylista gomb,
- opcionálisan hang be/ki kapcsoló.

Célja:
- gyors belépés a játékba,
- fő funkciók könnyű elérése.

## 9.2 Help-ablak
A help-ablak röviden és érthetően bemutatja a szabályokat.

Javasolt tartalom:
- mozgás vezérlése,
- támadás gomb,
- célok leírása,
- loot működése,
- hátizsák limit,
- vereségi feltétel.

A help-ablak legyen rövid, vizuálisan tagolt, könnyen átfutható.

## 9.3 Eredménylista ablak
Az eredménylista a korábbi legjobb eredményeket mutatja.

Lehetséges adatok:
- pontszám,
- játék időtartama,
- leadott loot mennyisége,
- dátum.

Célja:
- visszajátszási motiváció,
- teljesítmény összehasonlítása.

## 9.4 Játék közbeni HUD
A HUD nem külön ablak, hanem folyamatosan látható információs réteg.

Javasolt elemek:
- aktuális pontszám,
- hátizsák: 0/4 – 4/4,
- elszökött ellenségek száma,
- esetleg aktuális nehézségi szint vagy eltelt idő.

## 9.5 Szünet / pause ablak
Opcionális, de hasznos.

Tartalma:
- folytatás,
- újrakezdés,
- vissza a főmenübe.

## 9.6 Játék vége ablak
Megjelenik vereség esetén.

Tartalma:
- végső pontszám,
- leadott loot mennyiség,
- elszökött ellenségek száma,
- újrakezdés gomb,
- főmenü gomb,
- eredmény mentése / megjelenítése.

---

## 10. Use-case-ek

Az alábbi use-case-ek a játék fő felhasználói és rendszereseményeit írják le.

## UC-01 – Játék indítása
**Szereplő:** játékos  
**Cél:** új játék indítása.

**Előfeltétel:** a nyitóablak meg van nyitva.

**Fő folyamat:**
1. A játékos megnyitja a játékot.
2. A rendszer megjeleníti a nyitóablakot.
3. A játékos a Start gombra kattint.
4. A rendszer betölti a pályát és elindítja a játékot.

**Eredmény:** a játék aktív állapotba kerül.

## UC-02 – Help megnyitása
**Szereplő:** játékos  
**Cél:** szabályok megtekintése.

**Előfeltétel:** a nyitóablak vagy pause menü látható.

**Fő folyamat:**
1. A játékos a Help gombra kattint.
2. A rendszer megjeleníti a help-ablakot.
3. A játékos elolvassa a szabályokat.
4. A játékos visszalép.

**Eredmény:** a játékos tájékozódik a szabályokról.

## UC-03 – Eredménylista megnyitása
**Szereplő:** játékos  
**Cél:** korábbi eredmények megtekintése.

**Előfeltétel:** a nyitóablak meg van nyitva.

**Fő folyamat:**
1. A játékos az Eredménylista gombra kattint.
2. A rendszer megjeleníti a mentett eredményeket.
3. A játékos visszatér a nyitóablakba.

**Eredmény:** a játékos megtekinti a high score listát.

## UC-04 – Karakter mozgatása
**Szereplő:** játékos  
**Cél:** a karakter pozíciójának változtatása.

**Előfeltétel:** aktív játékmenet.

**Fő folyamat:**
1. A játékos mozgási inputot ad.
2. A rendszer a karaktert az adott irányba mozgatja.
3. A rendszer ütközést ellenőriz az akadályokkal.
4. Ha ütközés történne, a mozgás azon irányban megáll.

**Eredmény:** a karakter a járható pályarészen mozog.

## UC-05 – Ellenség üldözése és megütése
**Szereplő:** játékos  
**Cél:** az ellenség megsebzése.

**Előfeltétel:** legalább egy aktív ellenség van a pályán.

**Fő folyamat:**
1. A játékos az ellenség közelébe mozog.
2. A játékos támadást indít.
3. A rendszer létrehozza az egyszerű támadási hitboxot.
4. Ha a hitbox metszi az ellenség hitboxát, találat történik.
5. A rendszer lejátsza a találati animációt.
6. Az ellenség sebzést kap.

**Alternatív folyamat:**
- Ha a támadás nem talál, nem történik sebzés.

**Eredmény:** az ellenség sebződik, vagy a támadás elhibázott.

## UC-06 – Ellenség legyőzése
**Szereplő:** rendszer  
**Cél:** az ellenség eltávolítása második találat után.

**Előfeltétel:** az ellenség már kapott egy vagy két találatot.

**Fő folyamat:**
1. Az ellenség megkapja a második találatot.
2. A rendszer lejátsza a végső találati animációt.
3. A rendszer lootot hoz létre.
4. Az ellenség eltűnik a pályáról.

**Eredmény:** az ellenség megszűnik, loot marad utána.

## UC-07 – Loot felvétele
**Szereplő:** játékos  
**Cél:** érték felvétele.

**Előfeltétel:** loot van a pályán, a játékos hátizsákja nincs tele.

**Fő folyamat:**
1. A játékos hozzáér a loothoz.
2. A rendszer ellenőrzi a hátizsák kapacitását.
3. A rendszer a lootot hozzáadja a hátizsákhoz.
4. A loot eltűnik a pályáról.

**Alternatív folyamat:**
- Ha a hátizsák tele van, a loot a pályán marad, amíg le nem jár az ideje.

**Eredmény:** a játékos eggyel több értéket visz.

## UC-08 – Loot eltűnése idő lejárta miatt
**Szereplő:** rendszer  
**Cél:** lejárt loot eltávolítása.

**Előfeltétel:** loot aktív a pályán.

**Fő folyamat:**
1. A rendszer számolja a loot élettartamát.
2. A lejárat előtti utolsó szakaszban a loot villogni kezd.
3. Az idő letelik.
4. A rendszer eltávolítja a lootot.

**Eredmény:** a fel nem vett loot megszűnik.

## UC-09 – Loot leadása az NVVH-nál
**Szereplő:** játékos  
**Cél:** pontszerzés.

**Előfeltétel:** a játékos legalább 1 lootot visz.

**Fő folyamat:**
1. A játékos belép az NVVH zónába.
2. A rendszer megszámolja a nála lévő lootot.
3. A rendszer jóváírja a pontokat.
4. A rendszer kiüríti a hátizsákot.
5. A rendszer visszajelzést ad a sikeres leadásról.

**Eredmény:** a játékos pontot kap és újra szabad kapacitással rendelkezik.

## UC-10 – Ellenség eléri a repteret
**Szereplő:** rendszer  
**Cél:** menekülés regisztrálása.

**Előfeltétel:** az ellenség aktív és eljutott a célzónába.

**Fő folyamat:**
1. Az ellenség belép a reptér zónába.
2. A rendszer növeli az elszökött ellenségek számát.
3. A rendszer eltávolítja az ellenséget.
4. A rendszer ellenőrzi a vereségi küszöböt.

**Eredmény:** az ellenség sikeresen megszökött.

## UC-11 – Játék vége
**Szereplő:** rendszer  
**Cél:** vereségi állapot kezelése.

**Előfeltétel:** az elszökött ellenségek száma eléri a küszöböt.

**Fő folyamat:**
1. A rendszer leállítja az aktív játékmenetet.
2. Megjeleníti a játék vége ablakot.
3. Megjeleníti a végső pontszámot és statisztikákat.
4. Elmenti az eredményt, ha szükséges.

**Eredmény:** a futam lezárul.

---

## 11. Képernyők és állapotok

A játék működése állapotokként is felfogható:
- **Main Menu** – nyitóablak
- **Help** – súgó / szabályok
- **Leaderboard** – eredménylista
- **Playing** – aktív játék
- **Paused** – szüneteltetett játék
- **Game Over** – végeredmény képernyő

Az állapotok közötti átmenetek egyszerűek és jól elkülöníthetők, ami támogatja az egyszerű implementációt.

---

## 12. Javasolt HUD információk

A HUD minimális, de informatív legyen.

Kötelező, **prominens elemek**:
- **Pont**: a jelenlegi pontszám (az eddigi sikeres leadások összege) – nagy, jól látható
- **Hátizsák**: hány érték van nála (0/4, 1/4, ... 4/4) – vizuálisan világos, ikonnal vagy szöveggel
- **Elszökött ellenségek**: hányan jutottak már a reptérre (pl. "3/10") – figyelmeztető hatáson
- **Játékidő vagy nehézségi szint** – szükség szerint.

Opcionális elemek:
- rövid üzenet leadáskor ("+ 100 pont!"),
- rövid üzenet hátizsák megtelésekor ("A hátizsák megtelt!"),
- rövid figyelmeztetés, ha közel a game over ("Még 2 ellenség!").

---

## 13. Hangok és visszajelzések

Az egyszerű mobiljáték feelinghez érdemes rövid, tiszta hangokat használni:
- ütés hang,
- találat hang,
- loot felvétel hang,
- leadás hang,
- figyelmeztető hang loot villogáskor vagy game over közelében.

A hangok ne legyenek túl hosszúak vagy realisztikusak, inkább arcade jellegűek.

---

## 14. Javasolt MVP tartalom

Az első játszható verzióhoz elegendő:
- 1 pálya,
- 1 játékos karakter,
- 1 alap ellenségtípus,
- 3–4 akadály,
- 3 fő pont (Hatvanpuszta, Reptér, NVVH),
- 1 fajta közelharci támadás,
- loot rendszer,
- pontszámítás,
- nyitóablak,
- help-ablak,
- eredménylista,
- game over képernyő.

Ez már teljes, játszható, tesztelhető alapverziót ad.

---

## 15. Nyitott tervezési kérdések a későbbi iterációkhoz

Később eldönthető kérdések:
- a különböző lootok érjenek-e eltérő pontszámot,
- legyen-e sprint vagy speciális mozgás,
- legyen-e több pálya,
- legyen-e többféle ellenség,
- legyen-e combo vagy gyors egymás utáni támadás jutalmazása,
- legyen-e vizuális különbség az egyes nehézségi szintek közt.

Ezek nem szükségesek az első verzióhoz.

---

## 16. Összefoglalás

A játék koncepciója jól alkalmas egy egyszerű, böngészőben futó, gyors tempójú arcade játékra.

A legfontosabb tervezési előnyök:
- fix pálya,
- fix kamera,
- egyszerű szabályrendszer,
- könnyen olvasható célok,
- alacsony technikai kockázat,
- gyors prototipizálhatóság.

A játék erőssége a letisztult core loop:
**üldözés → ütés → loot → leadás → pontszerzés**.

A HUD világos megjelenítése (pont, hátizsák, elszökött ellenségek) és az akadályok/loot rácskocka-alapú elrendezése támogatja az egyértelmű játékélményt.

Ez megfelelő alapot ad egy gyorsan elkészíthető és később bővíthető HTML-alapú játékhoz.
