# Heroes of NVVH – Részletes architektúra terv

## 1. Cél és hatókör

Ez a dokumentum a játék implementációs architektúráját rögzíti a már elfogadott döntések alapján.

- Engine: Phaser 3
- Nyelv: TypeScript
- Build: Vite
- Teszt: Vitest
- Pálya: 7×6 logikai rács, trapéz vizuális torzítással
- Pathfinding: saját A*
- Collision: saját, cserélhető szolgáltatásrétegen keresztül
- Audio: Phaser audio, cserélhető wrapper mögött
- Deploy: statikus fájlkiszolgálás (GitHub Pages), backend nélkül

Kapcsolódó döntés ID-k:
- Engine: D-001
- Nyelv: D-002
- Build: D-003
- Teszt: D-004
- Pálya/rács: D-006, D-007, D-008
- Pathfinding: D-013
- Collision: D-014
- Audio: D-016
- Deploy/statikus működés: D-005, D-017, D-018

---

## 2. Rendszerkörnyezet (System Context)

Kapcsolódó döntés ID-k: **D-005, D-017, D-018**.

```mermaid
flowchart LR
    Player[Játékos - Desktop böngésző]
    Browser[Browser Runtime]
    Game[Heroes of NVVH - Phaser app]
    Assets[Statikus assetek\nPNG/WebP, JSON, WAV/MP3]
    Storage[LocalStorage\nHigh score + beállítások]
    GH[GitHub Pages\nstatikus hosting]

    Player --> Browser
    Browser --> Game
    Game --> Assets
    Game <--> Storage
    Browser --> GH
    GH --> Browser
```

Megjegyzés:
- Nincs aktív backend API.
- Nincs telemetria.
- Nincs PWA/service worker réteg.

---

## 3. Logikai komponens architektúra

```mermaid
flowchart TB
    subgraph Scenes[Scene réteg]
      Boot[BootScene]
      Menu[MenuScene]
      Help[HelpScene]
      GameScene[GameScene]
      UI[UIScene]
      GameOver[GameOverScene]
      Leaderboard[LeaderboardScene]
    end

    subgraph Core[Core rendszerek]
      GS[GameState]
      EM[EnemyManager]
      LM[LootManager]
      DM[DifficultyManager]
      SM[ScoreManager]
      CM[CollisionSystem]
      CP[ICollisionProvider\nSimpleCollisionProvider]
      AS[AudioSystem]
      AP[IAudioService\nPhaserAudioService]
      PM[PathfindingService - A*]
      GRID[GridSystem\n7x6 + cella foglaltság]
    end

    subgraph Data[Adat + Asset]
      Map[level01.json]
      Atlas[Sprite Atlas + textures]
      AudioFiles[Audio fájlok]
      LS[LocalStorage]
    end

    Boot --> Atlas
    Boot --> AudioFiles
    Boot --> Map
    Menu --> GameScene
    Menu --> Help
    Menu --> Leaderboard

    GameScene --> GS
    GameScene --> EM
    GameScene --> LM
    GameScene --> DM
    GameScene --> CM
    GameScene --> AS
    GameScene --> GRID
    UI --> GS
    UI --> SM
    GameOver --> SM
    Leaderboard --> LS

    EM --> PM
    EM --> GRID
    LM --> GRID
    CM --> CP
    AS --> AP

    GS <--> LS
    SM <--> LS
```

---

## 4. Scene és állapotmodell

```mermaid
stateDiagram-v2
    [*] --> Boot
    Boot --> MainMenu

    MainMenu --> Help : Help
    Help --> MainMenu : Vissza

    MainMenu --> Leaderboard : Eredménylista
    Leaderboard --> MainMenu : Vissza

    MainMenu --> Playing : Start

    state Playing {
      [*] --> Active
      Active --> Paused : Pause
      Paused --> Active : Resume
      Active --> GameOver : Escape threshold reached
    }

    GameOver --> MainMenu : Főmenü
    GameOver --> Playing : Újraindítás
```

---

## 5. Játékmeneti ciklus és update sorrend

```mermaid
sequenceDiagram
    participant Input as Input Layer
    participant Scene as GameScene
    participant Enemy as EnemyManager
    participant Path as A* Service
    participant Coll as CollisionSystem
    participant Loot as LootManager
    participant State as GameState
    participant UI as UIScene

    loop Frame update (deltaTime)
        Input->>Scene: Player input (move/attack)
        Scene->>Coll: Player mozgás ütközésellenőrzése
        Coll-->>Scene: Engedett/tiltott elmozdulás

        Scene->>Enemy: Enemy update
        Enemy->>Path: (spawnkor) útvonal számítás
        Path-->>Enemy: Waypoint lista
        Enemy->>Coll: Enemy/obstacle check

        Scene->>Coll: Attack hitbox vs enemy hitbox
        Coll-->>Scene: Találatok
        Scene->>Loot: Loot drop trigger

        Loot->>State: Pickup/TTL/leadás események
        Enemy->>State: Elszökött enemy increment
        Scene->>State: Pont + inventory változások

        State->>UI: Snapshot (pont, inventory, escaped)
    end
```

---

## 6. Rács + útvonaltervezés (A*)

Kapcsolódó döntés ID-k: **D-007, D-008, D-013**.

```mermaid
flowchart TD
    Start[Enemy spawn Hatvanpusztán] --> BuildGrid[Járhatósági rács előállítás\n7x6]
    BuildGrid --> MarkBlocks[Akadálycellák blokkolása]
    MarkBlocks --> RunAStar[A* futtatása spawn -> reptér]
    RunAStar --> PathOk{Lett útvonal?}
    PathOk -- Igen --> Store[Waypoint lista mentése enemy-be]
    Store --> Follow[Enemy waypoint követés frame-enként]
    PathOk -- Nem --> Fallback[Fallback: enemy despawn / respawn]
    Follow --> Reached{Elérte a repteret?}
    Reached -- Igen --> Escaped[Escaped counter + check game over]
    Reached -- Nem --> Continue[Haladás következő pont felé]
```

---

## 7. Collision architektúra (cserélhetőség)

Kapcsolódó döntés ID: **D-014**.

```mermaid
classDiagram
    class ICollisionProvider {
      <<interface>>
      +overlaps(a, b) boolean
      +collidesWithObstacles(rect, obstacles) boolean
      +queryLootPickup(playerRect, lootRects) number[]
      +queryZoneOverlap(rect, zones) string[]
    }

    class SimpleCollisionProvider {
      +overlaps(a, b) boolean
      +collidesWithObstacles(rect, obstacles) boolean
      +queryLootPickup(playerRect, lootRects) number[]
      +queryZoneOverlap(rect, zones) string[]
    }

    class PhaserArcadeCollisionProvider {
      +overlaps(a, b) boolean
      +collidesWithObstacles(rect, obstacles) boolean
      +queryLootPickup(playerRect, lootRects) number[]
      +queryZoneOverlap(rect, zones) string[]
    }

    class CollisionSystem {
      -provider: ICollisionProvider
      +setProvider(provider)
      +checkPlayerMove()
      +checkAttackHits()
      +checkLootPickup()
      +checkZoneOverlap()
    }

    ICollisionProvider <|.. SimpleCollisionProvider
    ICollisionProvider <|.. PhaserArcadeCollisionProvider
    CollisionSystem --> ICollisionProvider
```

Megjegyzés:
- MVP-ben `SimpleCollisionProvider` aktív.
- Később provider cserével váltható más implementációra.

---

## 8. Audio architektúra (cserélhetőség)

Kapcsolódó döntés ID: **D-016**.

```mermaid
classDiagram
    class IAudioService {
      <<interface>>
      +playSfx(key)
      +playMusic(key, loop)
      +stopMusic()
      +setMasterVolume(value)
      +setMuted(muted)
    }

    class PhaserAudioService
    class HowlerAudioService
    class AudioSystem {
      -service: IAudioService
      +playHit()
      +playPickup()
      +playDeposit()
      +playWarning()
    }

    IAudioService <|.. PhaserAudioService
    IAudioService <|.. HowlerAudioService
    AudioSystem --> IAudioService
```

Megjegyzés:
- MVP-ben `PhaserAudioService` használata.
- `HowlerAudioService` csak későbbi csereopció.

---

## 9. Adatmodell

```mermaid
classDiagram
    class LevelConfig {
      +name: string
      +width: number
      +height: number
      +gridCellSize: number
      +spawnPoint: GridPoint
      +goalPoint: GridPoint
      +depositPoint: GridPoint
      +obstacles: Obstacle[]
      +difficulty: DifficultyConfig
    }

    class GridPoint {
      +gridX: number
      +gridY: number
    }

    class Obstacle {
      +gridX: number
      +gridY: number
      +type: car|building
    }

    class Enemy {
      +id: string
      +hp: number
      +speed: number
      +path: GridPoint[]
      +state: Escaping|Hit|Despawned
    }

    class Loot {
      +id: string
      +type: money|gold|car
      +gridX: number
      +gridY: number
      +ttlMs: number
      +blinkBeforeExpireMs: number
    }

    class Player {
      +position: Vector2
      +inventoryCount: number
      +inventoryMax: 4
      +score: number
    }

    LevelConfig --> Obstacle
    LevelConfig --> GridPoint
    Enemy --> GridPoint
    Loot --> GridPoint
```

---

## 10. Build + deployment architektúra

Kapcsolódó döntés ID-k: **D-003, D-005, D-018**.

```mermaid
flowchart LR
    Dev[Fejlesztő]
    Src[src/*.ts + assets + data]
    Vite[Vite build]
    Dist[dist/ statikus csomag]
    GH[GitHub repository]
    GHP[GitHub Pages]
    Browser[Felhasználó böngésző]

    Dev --> Src
    Src --> Vite
    Vite --> Dist
    Dist --> GH
    GH --> GHP
    GHP --> Browser
```

Működési jellemzők:
- Statikus hosting.
- Nincs aktív backend futásidőben.
- Nincs service worker/PWA réteg.

---

## 11. Nem-funkcionális követelmények

- Célzott platform: desktop böngésző.
- Stabil 60 FPS cél (MVP-ben legalább folyamatos játékélmény).
- Alacsony input késleltetés.
- Egyszerű, jól olvasható HUD.
- Determinisztikus rácslogika enemy pathing és loot/akadály kezeléshez.

---

## 12. MVP implementációs sorrend

1. Projekt bootstrap (`Phaser + TS + Vite`).
2. Scene keret: Boot / Menu / Game / UI / GameOver.
3. Pálya és rács betöltés (`level01.json`).
4. Player mozgás + akadályütközés (`SimpleCollisionProvider`).
5. Enemy spawn + A* + waypoint követés.
6. Attack rendszer + 2-hit enemy flow.
7. Loot drop/pickup/TTL + blink.
8. NVVH leadás + pontszám + escaped/game over.
9. Audio wrapper + alap SFX.
10. LocalStorage highscore + polish.

---

## 13. Kockázatok és mitigáció

- Pathfinding edge case (nincs útvonal): fallback despawn/respawn stratégia.
- Collision false positive: hitbox méretek központosított konfigurálása.
- Asset memóriahasználat: atlas méret és frame szám limitálása.
- Diagram és implementáció eltérés: döntési napló + architektúra dokumentum együtt frissítendő.

---

## 14. Kapcsolódó dokumentumok

- [docs/Decisions.md](docs/Decisions.md)
- [docs/Tech.md](docs/Tech.md)
- [docs/JatekLeiras.md](docs/JatekLeiras.md)
- [docs/Vizualitas.md](docs/Vizualitas.md)
