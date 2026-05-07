# Heroes of NVVH – vizuális koncepció

## 1. Dokumentum célja

Ez a dokumentum a játék vizuális világát, hangulatát, képi szabályait és a pálya fő látványelemeit írja le. A cél egy olyan egységes art direction meghatározása, amely:

- támogatja az egyszerű, gyors, arcade jellegű játékmenetet,
- jól olvasható marad asztali böngészőben,
- erős, könnyen felismerhető formákat használ,
- alapot ad későbbi illusztrációkhoz, mockupokhoz és koncept-artokhoz.

A dokumentum úgy készült, hogy később egy vizuális példaillusztráció vagy koncept-art is készülhessen belőle.

---

## 2. Vizuális alapkoncepció

A játék összhatása:

- **arcade jellegű**, gyorsan értelmezhető,
- **rajzfilmes**, enyhén karikatúraszerű,
- **mókás hangulatú**, nem realista,
- **nagy, jól látható alakokkal és ikonokkal** dolgozó,
- **egyszerű, kontrasztos, tiszta sziluettekre épülő** vizualitás.

A játék világának célja nem a részletgazdag realizmus, hanem a **pillanatok alatt olvasható képernyő**. A játékosnak rögtön meg kell tudnia különböztetni:

- saját karakterét,
- az ellenségeket,
- a felvehető értékeket,
- az akadályokat,
- a három különleges pontot,
- valamint az interaktív és nem interaktív elemeket.

A vizuális filozófia kulcsszavai:

- **olvashatóság**,
- **egyszerűség**,
- **humor**,
- **erős formai különbségek**,
- **játékosság**.

---

## 3. Kamera és nézet

A játék 2.5D jellegű megjelenítést használ, de a játéktér egyetlen képernyőn látható, a kamera nem mozog.

### 3.1 Nézeti elv
A látvány alapvetően felülről enyhén döntött, 2.5D hatású lehet, de a mozgáslogika síkbeli 2D marad. A hangsúly nem a perspektivikus pontosságon, hanem az olvasható térelrendezésen van.

### 3.2 Fix kamera előnyei
A fix kamera miatt:

- a teljes pálya egyszerre belátható,
- a játékos gyorsan felméri a helyzetet,
- a UI egyszerűbben szervezhető,
- a koncept-art könnyebben megkomponálható.

A vizuális tervezésnél a teljes képernyő egyetlen, jól szervezett játéktérként kezelendő.

---

## 4. Pálya vizuális struktúrája

## 4.1 Rácsalapú felosztás
A pálya vizuális és logikai alapja egy **7 × 6-os rács**.

Ez azt jelenti, hogy a játékterület:
- 7 oszlopra,
- 6 sorra
oszlik.

A rács elsősorban **tervezési és méretezési referencia**, nem pedig merev mozgási korlát.

### 4.2 A rács szerepe
A rácsméret meghatározza:

- a játékos hozzávetőleges méretét,
- az ellenségek méretét,
- a loot és egyéb interaktív elemek méretarányát,
- az akadályok helyigényét,
- a pályán belüli vizuális ritmust.

### 4.3 Nem grid-locked mozgás
Fontos, hogy bár a pálya rácsos felosztású, a mozgás **nem kötődik a rácshoz**.

A karakterek:
- finoman,
- folyamatosan,
- szabadon mozognak a járható felületen.

Ez vizuálisan modernebb és kellemesebb, mint a celláról cellára lépkedő mozgás, miközben a rács továbbra is segíti az elrendezést és a pályatervezést.

### 4.4 A rács láthatósága
A rács **nem kell, hogy erősen kirajzolódjon** a játékban. Inkább rejtett struktúraként működjön.

Megoldások:
- a háttér textúrájában finoman utalhat rá a burkolat tagolása,
- az útburkolati elemek, járdaszegélyek, térkövek, festések igazodhatnak hozzá,
- koncept-arton a kompozícióhoz használható, de a végleges játékban ne legyen túl technikai hatású.

---

## 5. Környezet és helyszín hangulata

## 5.1 Alaphelyszín
A környezet **városias jellegű**.

A pálya ne természetközeli vagy vadregényes legyen, hanem olyan terület, amelyben ember alkotta, urbánus elemek dominálnak.

Javasolt környezeti karakter:
- külvárosi vagy ipari jellegű városi rész,
- nagyobb aszfaltos, burkolt felületek,
- parkoló- vagy udvarszerű nyitott tér,
- néhány vizuálisan karakteres akadállyal.

### 5.2 Hangulati cél
A környezet ne legyen komor vagy realista. Inkább:
- színes,
- stilizált,
- enyhén túlzó,
- könnyen olvasható.

Az összhatás egy könnyed, kissé szatirikus, játékos világ legyen.

---

## 6. Akadályok vizuális szerepe

Az akadályok fontos részei a pálya olvashatóságának és karakterének.

## 6.1 Akadálytípusok
A megadott irány alapján az akadályok lehetnek például:
- autók,
- házak.

Később ezek bővíthetők más városi elemekkel, de az első koncepcióhoz ez a két típus elegendő.

## 6.2 Autók mint akadályok
Az autók:
- nagy, tömör, könnyen felismerhető formák legyenek,
- felülnézetből vagy enyhén döntött nézetből is jól olvashatók,
- színük eltérjen a háttértől,
- lehetnek enyhén humoros, túlrajzolt járművek.

Vizuális cél:
- egy pillantásra akadályként azonosíthatók legyenek,
- ne tűnjenek felvehető vagy mozgó objektumnak.

## 6.3 Házak mint akadályok
A házak:
- egyszerű, blokkos tömegűek legyenek,
- túl sok apró részlet nélkül,
- erős körvonallal,
- karakteres tető- vagy homlokzati elemekkel.

A házaknak nem kell valósághű méretarányt követniük; fontosabb a stilizált, játékbarát megjelenés.

## 6.4 Akadályok elhelyezése
Az akadályok:
- tagolják a pályát,
- folyosókat és kerülőutakat alakítanak ki,
- vizuálisan megtörik a nyílt teret,
- segítenek érdekes üldözési helyzeteket létrehozni.

A koncept-artban ezért érdemes úgy elhelyezni őket, hogy a fő mozgási útvonalak olvashatóak maradjanak.

---

## 7. A három különleges pont vizuális kezelése

A három különleges pont:
- **Hatvanpuszta**,
- **Reptér**,
- **NVVH székház**.

Ezek nagyon fontos elemek, de a megadott szabály szerint **a pálya mellett helyezkednek el, és nem részei a játéktérnek**.

## 7.1 Elhelyezési elv
A három pont a fő pálya peremén túl, a játéktérhez kapcsoltan jelenik meg, mintha a pályán kívüli fontos helyszínek lennének.

Ez vizuálisan jelentheti például:
- a pálya szélein túl látható különálló épület- vagy helyszínjelzéseket,
- nagyméretű táblákat vagy ikonikus struktúrákat,
- irányjelző kapcsolatot a pálya és a helyszín között.

## 7.2 Funkciójuk a képen
Ezeknek a pontoknak azonnal felismerhetőnek kell lenniük, mert a játék fő céljai hozzájuk kötődnek.

### Hatvanpuszta
Vizuális szerepe:
- indulási pont,
- fenyegetés forrása,
- ellenség spawn-zóna jelképe.

Megjelenhet:
- kapuként,
- útkiindulásként,
- táblával vagy jelöléssel.

### Reptér
Vizuális szerepe:
- veszteségi célpont,
- menekülési végpont.

Megjelenhet:
- kifutópálya-részlettel,
- terminál-sziluettel,
- irányítótorony-jellel,
- repülős piktogrammal.

### NVVH székház
Vizuális szerepe:
- biztonságos leadási pont,
- a játékos célja,
- pozitív visszacsatolás helye.

Megjelenhet:
- karakteres épületként,
- emblémával,
- erős, hivatalos, de karikaturisztikus formával.

## 7.3 Kompozíciós szempont
Mivel a három pont nem része a bejárható pályának, a koncept-artban úgy célszerű ábrázolni őket, hogy:
- vizuálisan kapcsolódjanak a pályához,
- de egyértelműen kívül essenek a fő játéktéren,
- ne legyen félreérthető, hogy a karakterek ezekbe a képi blokkokba szabadon beléphetnek-e.

---

## 8. Karakterdizájn irányelvek

## 8.1 Általános karakterstílus
A karakterek:
- enyhén karikatúraszerűek,
- nagy fejjel vagy túlzó arányokkal is működhetnek,
- erős sziluettel rendelkezzenek,
- könnyen felismerhetők legyenek távolról is.

A cél nem a finom részlet, hanem az azonnali azonosíthatóság.

## 8.2 Játékos karakter
A főszereplő vizuális követelményei:
- legyen markánsan elkülöníthető az ellenségektől,
- legyen hősies, de kissé humoros hatású,
- mozgás közben jól olvasható pózokat vegyen fel,
- támadáskor legyen látványos, eltúlzott mozdulata.

A karakter külső megjelenése legyen alkalmas arra, hogy kis méretben is jól értelmezhető maradjon.

## 8.3 Ellenségek
Az ellenségek:
- kissé komikus, menekülő figurák legyenek,
- mozgásuk lehet kapkodó, sietős, enyhén bohókás,
- sziluettjük legyen egyszerű és ismételhető.

Nem szükséges sok variáció az első koncepthez, de legalább egy jól felismerhető ellenségtípus kell.

## 8.4 Méretarány
Mivel a rács mérete a karakterek alapméretét is meghatározza, a figurák legyenek:
- a cellamérethez képest viszonylag nagyok,
- ne vesszenek el a háttérben,
- a hitbox-jellegű játékhoz illően kissé nagyvonalú méretűek.

---

## 9. Loot és ikonográfia

A loot fontos játékmechanikai elem, ezért vizuálisan azonnal észrevehetőnek kell lennie.

## 9.1 Általános elv
A loot:
- élénkebb színekkel jelenjen meg,
- legyen kisebb a karaktereknél, de ne legyen túl apró,
- enyhe csillanással, kontúrral vagy lebegő effektussal kiemelhető.

## 9.2 Lehetséges loot típusok
A korábbi játékleírásnak megfelelően lehet:
- pénz,
- arany,
- luxusautó ikonikus, leegyszerűsített formában,
- más humoros értéktárgy.

## 9.3 Olvashatóság
A loot soha ne olvadjon bele:
- az útburkolatba,
- az autó akadályokba,
- vagy az egyéb városi díszletekbe.

A koncept-artban is fontos, hogy a loot vizuális szerepe tiszta maradjon.

## 9.4 Eltűnés előtti jelzés
A loot eltűnés előtti villogása a végleges játékban fontos effekt. Ennek megfelelően már a vizuális tervben is ajánlott számolni olyan megjelenéssel, amely:
- normál állapotban stabil,
- lejárat előtt feltűnő,
- figyelemfelkeltő, de nem zavaró.

---

## 10. Animációs és mozgási hangulat

A hangulat a megadott irány szerint **mókás**, könnyed és szándékoltan nem túl komoly.

## 10.1 Mozgás hangulata
Az ellenfelek mozgása:
- lehet enyhén kapkodó,
- kicsit túlzó,
- vicces ritmusú,
- kissé pánikszerű.

A játékos mozgása lehet:
- gyors,
- határozott,
- enyhén hősies,
- jól kontrollálható.

## 10.2 Ütés animáció
Az ütésnek nem brutálisnak, hanem inkább humorosan hatékonynak kell érződnie.

Javasolt jellemzők:
- eltúlzott kar- vagy testmozdulat,
- rövid, pattanós animáció,
- egyértelmű irány,
- találat esetén komikus reakció.

## 10.3 Találati visszajelzés
A találat vizuális nyelve lehet:
- comic-szerű csapásjel,
- csillagok,
- becsapódó ív,
- gyors villanás,
- enyhe visszalökési mozdulat.

A cél egy könnyed, szórakoztató, nem agresszív arcade-hatás.

---

## 11. Színvilág

## 11.1 Általános színhasználat
A színpaletta legyen:
- telített, de nem harsányan kaotikus,
- vidám,
- tiszta,
- jól elkülöníthető rétegekre bontott.

## 11.2 Javasolt színlogika
- **Pálya / útburkolat:** semleges szürkés, bézses vagy aszfaltos tónusok
- **Akadályok:** karakteresebb, de még mindig környezethez illő színek
- **Játékos:** élénkebb, jól kiemelkedő főszín
- **Ellenségek:** a játékostól jól elkülönülő másodlagos színvilág
- **Loot:** arany, zöld, fényes, hangsúlyos tónusok
- **NVVH / Reptér / Hatvanpuszta:** egyedi, saját azonosító szín- vagy ikonrendszer

## 11.3 Kontraszt
A játékmenet miatt a karakterek és interaktív elemek erősebb kontrasztot kapjanak, mint a háttér.

A háttér legyen kellően visszafogott ahhoz, hogy:
- ne vonja el a figyelmet,
- de mégis karakteres környezetet adjon.

---

## 12. Formanyelv

A formák legyenek:
- lekerekítettek vagy enyhén puhítottak,
- rajzfilmszerűek,
- kevés apró részlettel,
- jól felismerhetők kis méretben is.

Kerülendő:
- túl realista textúrák,
- túl aprólékos részletek,
- vékony, nehezen olvasható kontúrok,
- túl sötét vagy túl zajos kompozíció.

A játék akkor működik jól, ha a teljes képernyő „egy pillantásra olvasható”.

---

## 13. UI és ikonok vizuális irányelvei

Mivel a játék arcade jellegű, a felhasználói felület is legyen egyszerű és azonnal értelmezhető.

## 13.1 Ikonok
Az ikonok:
- nagyok,
- tiszták,
- vastag körvonalúak,
- könnyen felismerhetők legyenek.

Példák:
- loot ikon,
- inventory slot ikon,
- pontszám jelző,
- help ikon,
- eredménylista ikon,
- hang ki/be ikon.

## 13.2 HUD stílus
A HUD legyen:
- letisztult,
- kontrasztos,
- könnyen olvasható,
- nem túlzóan díszes.

A koncept-art készítésekor is érdemes jelezni a HUD helyét, még ha nem is teljes részletességgel.

---

## 14. Koncept-art készítéshez szükséges képi fókuszpontok

Mivel ebből a dokumentumból később példaillusztráció készül, a koncepciórajz számára fontos fő képi elemek a következők.

## 14.1 A koncept-art fő célja
A kép mutassa meg egyszerre:
- a teljes pálya karakterét,
- a 7 × 6-os szervező logikát,
- a városias akadályokat,
- a főszereplőt,
- legalább egy-két ellenséget,
- lootot a pályán,
- valamint a három különleges pont pályán kívüli elhelyezését.

## 14.2 Javasolt kompozíció
A legerősebb koncepció valószínűleg egy olyan nézet lesz, amelyben:
- a teljes pálya egyszerre látható,
- a három különleges pont a pálya körül vagy szélei mellett helyezkedik el,
- a főszereplő és az ellenség akcióban van,
- egy vagy több akadály jól tagolja a teret,
- legalább egy loot tárgy látszik,
- a hangulat játékos és könnyed.

## 14.3 Mit kell elkerülni a koncept-artban
- túlzsúfolt pálya,
- túl sok apró díszlet,
- nehezen elkülöníthető karakterek,
- a három különleges pont félreérthető elhelyezése,
- túl realista vagy túl sötét városi környezet.

---

## 15. Koncept-art brief kivonat

Az alábbi rövid összefoglaló közvetlenül használható art briefként is.

### Rövid brief
Egy arcade jellegű, rajzfilmes, humoros hangulatú 2.5D böngészős játék vizuális terve szükséges. A pálya fix kamerás, teljes egészében látható, városias környezetben játszódik. A játéktér 7 × 6-os rács logikájára épül, de a mozgás szabad és folyamatos. A pályán autók és házak szolgálnak akadályként. A karakterek nagyok, jól láthatók, stilizáltak és rajzfilmszerűek. Az ellenfelek mozgása és az ütés animációja enyhén komikus, könnyed hangulatú. A három különleges pont – Hatvanpuszta, Reptér, NVVH székház – a pálya mellett helyezkedik el, vizuálisan kapcsolódnak a játéktérhez, de nem részei annak. A képen jól elkülönül a játékos, az ellenség, a loot és az akadályok rendszere.

---

## 16. Összefoglalás

A játék vizualitásának lényege:
- egyszerű,
- arcade-szerű,
- humoros,
- jól olvasható,
- erős formákra építő,
- városias, de nem realista.

A 7 × 6-os rács a pályatervezés stabil alapja, miközben a mozgás szabad és folyamatos marad. A városi akadályok, a pályán kívüli három kulcspont és a komikus animációs hangulat együtt olyan világot hoznak létre, amely egyszerre könnyen érthető és vizuálisan karakteres.

Ez megfelelő alapot ad:
- játékbeli asset-tervezéshez,
- UI- és pályatervezéshez,
- valamint egy első koncept-art illusztráció elkészítéséhez.
