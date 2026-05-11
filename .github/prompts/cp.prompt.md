---
name: "CP"
description: "Synchronize the git repository with the current files, create a relevant commit, and push it"
argument-hint: "Opcionálisan add meg a commit fókuszát vagy témáját"
agent: "agent"
model: "GPT-5 (copilot)"
---

Hajts végre egy teljes CP műveletet a HeroesOfNVVH repóban.

A CP jelentése ebben a projektben:

1. Szinkronizáld a git repót az aktuális fájlállapottal.
2. Készíts commitot releváns commit message-dzsel.
3. Pushold az aktuális branch-et.

Végrehajtási szabályok:

- Először nézd meg a git status-t és az aktuális branch-et.
- PowerShell alatt az upstream lekérdezésnél az `@{u}` részt idézőjelezni kell, például: `git rev-parse --abbrev-ref --symbolic-full-name "@{u}"`.
- A worktree alapján stage-eld a szükséges változásokat úgy, hogy a repó tükrözze a fájlrendszer aktuális állapotát.
- Ez magában foglalja az új fájlok hozzáadását, a módosított fájlok stage-elését és a törölt fájlok gitből való eltávolítását is.
- Ha a felhasználó a prompt indításakor megad fókuszt vagy témát, a commit message ezt tükrözze.
- Ha nem ad külön fókuszt, a commit message a stage-elt változások tartalma alapján legyen rövid, konkrét és szakmailag releváns.
- Ne használj semleges vagy értelmetlen commit message-et, például update, fix stuff vagy changes.
- A push az aktuális branch upstream céljára menjen.
- Ha nincs upstream branch, derítsd ki a megfelelő remote-ot és pushold úgy, hogy upstream is beálljon.
- Ha a git műveletet valamilyen hiba blokkolja, állj meg és pontosan írd le, mi akadályozta meg a CP-t.

Ajánlott lépéssor:

1. Ellenőrizd a branch-et és a git státuszt.
	Ajánlott PowerShell-barát ellenőrzés: `git branch --show-current`, `git status --short`, `git rev-parse --abbrev-ref --symbolic-full-name "@{u}"`.
2. Stage-eld a teljes aktuális változáshalmazt, beleértve az add és delete műveleteket is.
3. Nézd át röviden, mit fog tartalmazni a commit.
4. Készíts egy releváns commitot.
5. Pushold a branch-et.
6. A végén röviden jelezd, melyik branchre ment a push és mi lett a commit message.

Hasznos kontextus:

- [Projekt instrukciók](../copilot-instructions.md)