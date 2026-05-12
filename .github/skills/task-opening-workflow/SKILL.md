---
name: task-opening-workflow
description: 'Open a HeroesOfNVVH task in a consistent way: update the selected task status, create the task branch, and switch to that branch.'
argument-hint: 'Írd le melyik taskot kell megnyitni, ha ismert add meg az ID-t vagy a task nevét'
user-invocable: true
disable-model-invocation: false
---

# Task Opening Workflow

## When to Use

Használd ezt a skillt, amikor egy HeroesOfNVVH task megnyitása a cél, és a projektben használt egységes nyitási folyamatot kell követni.

Tipikus triggerek:

- task megnyitása
- open task
- nyisd meg a következő taskot
- hozz létre task branch-et
- állítsd in progress-re a taskot
- válts át a task branch-re

## Project Facts

- A taskok a [Tasks.json](../../../Tasks.json) fájlban vannak.
- A branch elnevezési konvenció: `feature/<task-name-kebab-case>`.
- A task megnyitásának minimális elvárt lépései:
  - az adott task státuszának frissítése,
  - új branch létrehozása,
  - átállás az új branch-re.

## Required Outcome

A task megnyitása csak akkor tekinthető késznek, ha:

- a megfelelő task státusza frissült,
- a hozzá tartozó branch létrejött,
- a repo az adott branch-en áll.

## Procedure

1. Azonosítsd a megnyitandó taskot.
2. Ellenőrizd a jelenlegi git branch-et és a worktree állapotát.
3. Határozd meg a branch nevét a task nevéből a `feature/<task-name-kebab-case>` szabály szerint.
4. Frissítsd a task státuszát a [Tasks.json](../../../Tasks.json) fájlban `in progress` értékre.
5. Hozd létre a branch-et, ha még nem létezik.
6. Állj át a branch-re.
7. Ellenőrizd vissza, hogy tényleg a megfelelő branch aktív.

## Detailed Rules

### 1. Task Identification

- A taskot lehetőleg task ID vagy task név alapján azonosítsd.
- Ha nem egyértelmű, nézd meg a [Tasks.json](../../../Tasks.json) fájlt.
- Ha a felhasználó csak annyit kér, hogy a következő taskot nyisd meg, preferáld a következő `ready` státuszú taskot.
- Ha több reális jelölt van, kérj rövid pontosítást.

### 2. Git State Check

- Ellenőrizd az aktuális branch-et.
- Ellenőrizd, van-e uncommitted változás.
- Ne revertálj felhasználói módosításokat.
- Ha a worktree dirty, ezt jelezd röviden a felhasználónak, de ha a branch létrehozható és a kérés nem tiltja, a folyamat folytatható.

### 3. Status Update Rule

- A kiválasztott task státusza legyen `in progress`.
- Csak a releváns task bejegyzést módosítsd, hacsak a felhasználó nem kér további státuszváltást.
- Ha a task már `in progress`, ne módosítsd feleslegesen, de a branch workflow-t attól még végig lehet vinni.

### 4. Branch Naming Rule

- A branch neve a task nevéből képzett kebab-case forma legyen.
- Példa: `Hero Character Design` -> `feature/hero-character-design`.
- A névből távolítsd el a speciális karaktereket, és az elválasztó legyen kötőjel.

### 5. Branch Creation Rule

- Ha a branch még nem létezik, hozd létre.
- Ha már létezik lokálisan, ne hozz létre újat ugyanazzal a névvel.
- Ha csak remote-on létezik, ahhoz igazodva hozz létre vagy checkoutolj megfelelő local branch-et.
- Preferáld a nem interaktív git parancsokat.

### 6. Branch Switch Rule

- A végállapot az legyen, hogy az adott task branch az aktív branch.
- A branchváltás után ellenőrizd vissza a tényleges aktív branch-et.

## Decision Points

### When to Stop

Állj meg és jelents vissza, ha:

- nem azonosítható egyértelműen a megnyitandó task,
- a [Tasks.json](../../../Tasks.json) nem módosítható biztonságosan,
- a git blokkoló hibát ad a branch létrehozására vagy checkoutra,
- merge konfliktus vagy más git inkonzisztencia miatt a branchváltás nem végezhető el.

### When to Continue Automatically

Menj végig a teljes folyamaton kérdés nélkül, ha:

- a task egyértelműen azonosítható,
- a branch neve egyértelműen levezethető,
- a git műveletek végrehajthatók,
- a felhasználó nem kért ettől eltérő workflow-t.

## Recommended Command Strategy

- Aktuális branch: `git branch --show-current`
- Git állapot: `git status --short`
- Létező branch-ek ellenőrzése: `git branch --list`, `git branch -r --list`
- Branch létrehozás és váltás: `git checkout -b <branch>` vagy szükség esetén `git checkout <branch>`

Mindig a lehető legkisebb kockázatú, nem interaktív git parancsokat preferáld.

## Final Response Requirements

A skill végén a válasz tartalmazza:

- melyik task lett megnyitva,
- változott-e a státusza a [Tasks.json](../../../Tasks.json) fájlban,
- mi lett a branch neve,
- új branch jött-e létre vagy már létezett,
- sikerült-e átállni a branch-re.