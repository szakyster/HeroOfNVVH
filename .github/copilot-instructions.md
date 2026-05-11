# GitHub Copilot Instructions

This repository contains a Phaser + TypeScript game prototype.

Project documentation available in this repository:

- `docs/Architecture.md`: architecture overview, scene and system responsibilities.
- `docs/Decisions.md`: key technical and product decisions.
- `docs/JatekLeiras.md`: gameplay and feature specification.
- `docs/Tech.md`: technology stack, project structure, and implementation notes.
- `docs/Vizualitas.md`: visual direction, HUD expectations, and art guidelines.
- `docs/conceptart01.svg` and `docs/conceptart02.svg`: concept art references.
- `docs/concepts/Enemy/`: enemy-related concept images.
- `docs/concepts/PSZ/`: additional concept/reference images.

When working in this project:

- Prefer small, focused changes that match the existing code style.
- Use TypeScript for source changes under `src/`.
- Keep scene-specific behavior in `src/scenes/` and reusable gameplay logic in `src/systems/`.
- Keep level and static asset references aligned with the existing `public/` structure.
- Preserve the current Phaser scene flow: `BootScene`, `MenuScene`, `PlayScene`, `GameOverScene`.
- Prefer extending the existing audio abstraction in `src/systems/AudioSystem.ts` instead of calling Phaser audio APIs ad hoc from scenes.
- Keep in-game UI text in Hungarian unless the task explicitly requires a different language.
- Add or update Vitest tests when changing reusable systems or fixing regressions.
- Avoid unrelated refactors while implementing a task.

Task closing workflow:

- Before closing a task, run the build.
- Before closing a task, run the relevant tests.
- If the build or tests fail, investigate and give detailed information about the failure. Do not try to solve the issue and stop the process.
- Before closing a task, if any relevant file's code coverage is below 25%, report that back to the user.
- If there are uncommitted changes, perform `CP` (git add + commit + push).
- When merging a completed task branch, use a non-fast-forward merge.
- After merge, close the task in `Tasks.json`.
- Unless the user says otherwise, open the next task after closing the current one.