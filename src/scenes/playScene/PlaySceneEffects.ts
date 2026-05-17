import { DEFAULT_LOOT_IMAGE_NAME, getLootAssetKey } from '../../systems/LootAssets';
import { getDepositPopupColor, type ActiveLoot, type LootValue } from './PlaySceneLoot';

type LootTemplate = {
  id: string;
  type: string;
  value: LootValue;
  image?: string;
};

type EllipseLike = {
  setDepth: (depth: number) => EllipseLike;
  destroy: () => void;
};

type ImageLike = {
  setDisplaySize: (width: number, height: number) => ImageLike;
  setDepth: (depth: number) => ImageLike;
  destroy: () => void;
};

type TextLike = {
  y: number;
  setOrigin: (value: number) => TextLike;
  setDepth: (depth: number) => TextLike;
  destroy: () => void;
};

type AddLike = {
  ellipse: (x: number, y: number, width: number, height: number, color: number, alpha: number) => EllipseLike;
  image: (x: number, y: number, texture: string) => ImageLike;
  text: (
    x: number,
    y: number,
    value: string,
    style: Record<string, unknown>,
  ) => TextLike;
};

type TweensLike = {
  add: (config: {
    targets: TextLike;
    y: number;
    alpha: number;
    duration: number;
    ease: string;
    onComplete: () => void;
  }) => unknown;
};

type SpawnDroppedLootArgs = {
  add: AddLike;
  template: LootTemplate;
  droppedLootCount: number;
  enemyPosition: { x: number; y: number };
  lootSize: { width: number; height: number };
  createdAt: number;
};

type ShowDepositPopupArgs = {
  add: AddLike;
  tweens: TweensLike;
  playerPosition?: { x: number; y: number };
  value: number;
  fontFamily: string;
};

export function spawnDroppedLoot({
  add,
  template,
  droppedLootCount,
  enemyPosition,
  lootSize,
  createdAt,
}: SpawnDroppedLootArgs): ActiveLoot {
  const lootTextureKey = getLootAssetKey(template.image ?? DEFAULT_LOOT_IMAGE_NAME);

  const shadow = add.ellipse(enemyPosition.x, enemyPosition.y + 18, 24, 10, 0x111111, 0.22).setDepth(2.1);
  const body = add
    .image(enemyPosition.x, enemyPosition.y + 4, lootTextureKey)
    .setDisplaySize(lootSize.width, lootSize.height)
    .setDepth(2.6);

  return {
    id: `${template.id}-${droppedLootCount}`,
    type: template.type,
    value: template.value,
    body: body as ActiveLoot['body'],
    shadow: shadow as ActiveLoot['shadow'],
    createdAt,
  };
}

export function showDepositPopup({ add, tweens, playerPosition, value, fontFamily }: ShowDepositPopupArgs): boolean {
  if (value <= 0 || !playerPosition) {
    return false;
  }

  const fontSize = value >= 50 ? '39px' : value >= 20 ? '34px' : '29px';
  const color = getDepositPopupColor(value);
  const popup = add
    .text(playerPosition.x, playerPosition.y - 78, `+${value} M Ft`, {
      fontFamily,
      fontSize,
      color,
      fontStyle: 'bold',
      stroke: '#102a43',
      strokeThickness: 5,
    })
    .setOrigin(0.5)
    .setDepth(8);

  tweens.add({
    targets: popup,
    y: popup.y - 54,
    alpha: 0,
    duration: 975,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      popup.destroy();
    },
  });

  return true;
}

export function destroyLootAndFilter(activeLoots: ActiveLoot[], loot: ActiveLoot): ActiveLoot[] {
  loot.body.destroy();
  loot.shadow.destroy();
  return activeLoots.filter((activeLoot) => activeLoot.id !== loot.id);
}

export function destroyEnemyVisuals(enemy: { body: { destroy: () => void }; shadow: { destroy: () => void } }): void {
  enemy.body.destroy();
  enemy.shadow.destroy();
}