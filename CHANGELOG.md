# Changelog

## Unreleased

Kiadás utáni változások a következő iterációhoz.

## v0.1.0-beta.1

Tervezett játszható béta kiadás előkészítése.

### Várható kiemelések
- egységesebb, játékhoz illeszkedő gomb- és UI-megjelenés
- finomított menü, leaderboard és game over navigáció gyorsbillentyűkkel
- escaped enemy warning riasztáshang
- további vizuális feedback és polish a jelenetekben

### Ismert release kockázatok
- a production build továbbra is nagy bundle warningot jelez
- a PlayScene és néhány helper modul coverage-e közepes, de a minimális release küszöb fölött van
- hibaágban továbbra is van egyszerű fallback szöveg: `Palyabetoltes hiba`

## v0.1.0-alpha.1

Első publikus alfa kiadás.

### Tartalom
- játszható Phaser + TypeScript játékprototípus
- menü, HUD és alap gameplay loop
- audio integráció menü- és játéktéri zenével
- helyi leaderboard mentés LocalStorage segítségével
- GitHub Pages deploy és frissített fejlesztői dokumentáció

### Ismert korlátok
- alfa állapot, a játékmenet és a balansz még változhat
- a teljes PlayScene lefedettség még nem magas, bár a minimum taskküszöb fölött van
- a build továbbra is nagy bundle warningot ad, ez jelenleg nem release blocker