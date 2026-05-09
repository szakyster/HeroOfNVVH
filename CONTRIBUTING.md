# Contributing to HeroOfNVVH

## Fejlesztési workflow

### Branch elnevezés
- `main` – stabil, pusható verzió
- `feature/*` – új funkciók
- `docs/*` – dokumentáció frissítések
- `fix/*` – bugfix-ek

### Commit üzenetek
Használj rövid, angol nyelvű, leíró üzeneteket:
- `Add feature: X`
- `Fix: Y`
- `Update docs: Z`
- `Refactor: W`

### Push előtt
- Ellenőrizd a `status`-t: `git status`
- Add hozzá a szükséges fájlokat: `git add .`
- Commit: `git commit -m "Your message"`
- Push: `git push`

### Hasznos parancsok
- Fejlesztői futtatás: `npm run dev`
- Build: `npm run build`
- Tesztek egyszeri futtatása: `npm run test -- --run`
- Coverage egyszeri futtatása: `npm run test:coverage -- --run`

### Task workflow
- Minden task külön feature branchen készüljön.
- Task zárás előtt fusson build és releváns teszt.
- Ha releváns fájl coverage-e 25% alatt van, azt jelezni kell taskzárás előtt.
- Task záráskor nem fast-forward merge-et használunk.

## Dokumentáció
- [Architecture](docs/Architecture.md) – architektúra és felelősségek
- [Decisions](docs/Decisions.md) – elfogadott döntések
- [Játékleírás](docs/JatekLeiras.md) – szabályok, játékmenet
- [Tech](docs/Tech.md) – stack és technikai részletek
- [Vizuális koncepció](docs/Vizualitas.md) – design, stílus
- [conceptart01.svg](docs/conceptart01.svg) – vizuális referencia
- [conceptart02.svg](docs/conceptart02.svg) – vizuális referencia

## Kérdések?
A dokumentációban található minden információ a tervezésről.
