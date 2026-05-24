import Phaser from 'phaser';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { createSceneTextButton } from '../systems/UiButtons';
import { SCENE_KEYS } from './sceneKeys';

const HELP_BODY_TEXT =
  'Szerezd vissza a Nemzeti Vagyont, és vidd vissza biztonságosan az NVVH központjába. Mozogj folyamatosan, kerüld el, hogy túl sok tolvaj elmeneküljön a Ferihegyen parkoló magángépével. A pálya akkor teljesül, ha elérted a célösszeget a kör végére. Ha egy szintet sikerrel lezársz, megnyílik a következő pálya, és új kihívások várnak rád. Irányítás: mozgás: WASD ütés: szóköz';

export class HelpScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.HELP);
  }

  create(): void {
    // Render a lightweight help screen with the core navigation actions.
    const { width, height } = this.scale;

    addSceneBackground(this, 'help');

    this.add
      .text(260, 380, HELP_BODY_TEXT, {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#f4f1de',
        align: 'left',
        wordWrap: { width: 370 },
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    this.createHelpButton(260, height - 110, 'Játék indítás', () => {
      this.scene.start(SCENE_KEYS.LEVEL_SELECT);
    });

    this.createHelpButton(260, height - 62, 'Vissza', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  private createHelpButton(x: number, y: number, label: string, onSelect: () => void): Phaser.GameObjects.Text {
    // Keep help navigation buttons aligned with the rest of the menu UI system.
    return createSceneTextButton(this, {
      x,
      y,
      label,
      width: 236,
      height: 36,
      fontSize: '18px',
      onSelect,
    });
  }
}