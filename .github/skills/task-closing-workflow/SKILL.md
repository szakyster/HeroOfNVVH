---
name: task-closing-workflow
description: 'Close a completed HeroesOfNVVH task end-to-end. Use for task closure, release readiness on a task branch, CP, build-and-test verification before closure, coverage check, non-fast-forward merge, Tasks.json updates, and opening the next task.'
argument-hint: 'Írd le melyik taskot kell lezárni, kell-e merge, és meg kell-e nyitni a következő taskot'
user-invocable: true
disable-model-invocation: false
---

# Task Closing Workflow

## When to Use

Használd ezt a skillt, amikor egy HeroesOfNVVH task lezárása a cél, és a teljes projekt-specifikus zárási folyamatot kell végrehajtani.

Tipikus triggerek:

- task lezárása
- task closing
- zárjuk le a taskot
- CP után merge
- build + test + coverage ellenőrzés
- Tasks.json frissítése
- következő task megnyitása

Ez a skill a repo [.github/copilot-instructions.md](../../copilot-instructions.md) fájljában definiált Task closing workflow-t hajtja végre a projekt tényleges scriptjeihez igazítva.

## Project Facts

- Build parancs: `npm run build`
- Alap tesztparancs: `npm test`
- Coverage parancs: `npm run test:coverage`
- Task státuszok a [Tasks.json](../../../Tasks.json) fájlban vannak.
- A repo elvárása szerint merge esetén non-fast-forward merge-et kell használni.
- Ha vannak uncommitted változások, a CP lépéshez elsősorban a [CP promptot](../../prompts/cp.prompt.md) használd.
- A CP jelentése ebben a repóban: `git add` + `git commit` + `git push`.

## Required Outcome

A tasklezárás csak akkor tekinthető késznek, ha az összes releváns lépés lefutott vagy világosan dokumentált blokkoló akadály maradt.

## Procedure

1. Azonosítsd a lezárandó taskot.
2. Nézd meg a git branch-et és a worktree állapotát.
3. Futtasd a buildet.
4. Futtasd a releváns teszteket.
5. Ha kell, futtasd a coverage-et és ellenőrizd, hogy van-e releváns 25% alatti lefedettség.
6. Ha build vagy teszt elbukik, állj meg, elemezd a hibát, és csak jelentsd vissza részletesen.
7. Ha vannak uncommitted változások, végezz CP-t.
8. Ha a felhasználó merge-et kér, végezz non-fast-forward merge-et.
9. Merge után zárd le a taskot a [Tasks.json](../../../Tasks.json) fájlban.
10. Ha a felhasználó nem mond mást, nyisd meg a következő taskot.

## Detailed Rules

### 1. Task Identification

- A taskot lehetőleg task ID vagy task név alapján azonosítsd.
- Ha nem egyértelmű, nézd meg a [Tasks.json](../../../Tasks.json) fájlt és az aktuális branch kontextusát.
- Ha több lehetséges task is szóba jöhet, kérj rövid pontosítást.

### 2. Git State Check

- Ellenőrizd az aktuális branch-et.
- Ellenőrizd, van-e upstream branch.
- PowerShell alatt az upstream lekérdezéshez idézőjelezd az `@{u}` részt: `git rev-parse --abbrev-ref --symbolic-full-name "@{u}"`.
- Ellenőrizd, van-e staged vagy unstaged változás.
- Ne revertálj felhasználói módosításokat.

### 3. Build Step

- Futtasd a `npm run build` parancsot.
- Ha a build hibás, a workflow itt megáll.
- A hibát röviden, de konkrétan jelentsd vissza: melyik parancs bukott el és mi volt a lényegi hiba.

### 4. Test Step

- Futtasd a releváns teszteket.
- Ha a feladat egyértelműen leszűkíthető néhány tesztfájlra, futtasd azokat célzottan.
- Ha ez nem egyértelmű, használd a teljes projekt tesztparancsát.
- Ha a teszt hibás, a workflow itt megáll.
- A hibát részletezd, de ne kezdj nem kapcsolódó javításba külön kérés nélkül.

### 5. Coverage Check

- Ha a lezárás részeként coverage információ szükséges, futtasd a `npm run test:coverage` parancsot, vagy használd a meglévő coverage riportot, ha igazoltan friss és releváns.
- Ellenőrizd a feladattal érintett releváns fájlokat.
- Ha bármely releváns fájl coverage-e 25% alatt van, ezt kötelezően jelentsd vissza a felhasználónak.
- A 25% alatti coverage önmagában nem feltétlenül blokkoló, de explicit riportálandó.

### 6. CP Rule

- Ha vannak uncommitted változások, végezz CP-t.
- A CP végrehajtásához elsősorban a [CP promptot](../../prompts/cp.prompt.md) használd.
- A CP prompt használatakor add át neki, ha van külön commit fókusz vagy témamegjelölés.
- Ha valamiért a prompt nem használható, fallbackként kézzel hajtsd végre ugyanazt a folyamatot.
- A CP jelentése ebben a repóban:
  - stage-eld a szükséges add és delete változásokat,
  - készíts releváns commit message-et,
  - pushold az aktuális branch-et.
- A commit message legyen konkrét, a változtatás tartalmához illeszkedő.
- Ne használj semmitmondó commit message-et.

### 7. Merge Rule

- Ha a felhasználó merge-et kér, non-fast-forward merge-et használj.
- Merge előtt ellenőrizd, hogy a branch naprakész és pusholt állapotban van-e.
- Merge után ellenőrizd, hogy a merge sikeres volt.

### 8. Tasks.json Update

- Merge után zárd le a megfelelő taskot a [Tasks.json](../../../Tasks.json) fájlban.
- A lezárt task státusza legyen `closed`, hacsak a projektfájl meglévő konvenciója mást nem indokol.
- Csak a megfelelő task bejegyzést módosítsd.

### 9. Open Next Task

- Ha a felhasználó nem mond mást, nyisd meg a következő taskot.
- A következő task jellemzően az első logikusan következő, még nem `closed` állapotú feladat.
- Preferáld a `ready` státuszú következő taskot, ha több nyitott task is van.
- A felhasználónak jelezd, melyik taskot nyitnád meg következőnek.

## Decision Points

### When to Stop

Állj meg és jelents vissza, ha:

- a build elbukik,
- a releváns tesztek elbuknak,
- nem azonosítható egyértelműen a lezárandó task,
- merge konfliktus vagy git blokkoló hiba van,
- a push hitelesítési vagy remote hiba miatt nem sikerül.

### When to Continue Automatically

Menj végig a teljes folyamaton kérdés nélkül, ha:

- a lezárandó task egyértelmű,
- a build és a tesztek sikeresek,
- a git műveletek végrehajthatók,
- a felhasználó nem tiltja a merge-et vagy a következő task megnyitását.

## Recommended Command Strategy

- Git állapot: `git branch --show-current`, `git status --short`, `git rev-parse --abbrev-ref --symbolic-full-name "@{u}"`
- Build: `npm run build`
- Teljes teszt: `npm test`
- Coverage: `npm run test:coverage`
- CP: `git add -A`, `git commit -m "..."`, `git push`
- Non-FF merge: `git merge --no-ff <branch>`

Mindig a lehető legkisebb kockázatú, nem interaktív git parancsokat preferáld.

## Final Response Requirements

A skill végén a válasz tartalmazza:

- sikerült-e a tasklezárás,
- milyen build és teszt parancsok futottak,
- volt-e 25% alatti releváns coverage,
- történt-e CP, és mi lett a commit message,
- történt-e merge,
- frissült-e a [Tasks.json](../../../Tasks.json),
- melyik lehet a következő task.