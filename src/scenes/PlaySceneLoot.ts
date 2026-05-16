import type Phaser from 'phaser';
import type { CollisionRect } from '../systems/ICollisionProvider';

export type LootValue = 10 | 20 | 50;

export type InventoryItem = {
  type: string;
  value: LootValue;
};

export type ActiveLoot = {
  id: string;
  type: string;
  value: LootValue;
  body: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  createdAt: number;
};

type CollisionProviderLike = {
  intersects: (first: CollisionRect, second: CollisionRect) => boolean;
};

type ProcessInventoryDepositArgs = {
  inventory: InventoryItem[];
  now: number;
  nextLootDepositAt: number | null;
  lootDepositIntervalMs: number;
  score: number;
};

type ProcessInventoryDepositResult = {
  inventory: InventoryItem[];
  nextLootDepositAt: number | null;
  score: number;
  depositedValue: LootValue | null;
};

export function getDepositPopupColor(value: number): string {
  if (value >= 50) {
    return '#ffd166';
  }

  if (value >= 20) {
    return '#80ed99';
  }

  return '#8ecae6';
}

export function getLootHitbox(
  centerX: number,
  centerY: number,
  lootSize: { width: number; height: number },
): CollisionRect {
  return {
    x: centerX - lootSize.width / 2,
    y: centerY - lootSize.height / 2,
    width: lootSize.width,
    height: lootSize.height,
  };
}

export function isPlayerInsideSanctuary(
  playerHitbox: CollisionRect,
  sanctuaryRects: CollisionRect[],
  collisionProvider: CollisionProviderLike,
): boolean {
  return sanctuaryRects.some((rect) => collisionProvider.intersects(playerHitbox, rect));
}

export function shouldPlayInventoryError(now: number, lastInventoryErrorAt: number, cooldownMs: number): boolean {
  return now - lastInventoryErrorAt >= cooldownMs;
}

export function processInventoryDeposit({
  inventory,
  now,
  nextLootDepositAt,
  lootDepositIntervalMs,
  score,
}: ProcessInventoryDepositArgs): ProcessInventoryDepositResult {
  if (inventory.length === 0) {
    return {
      inventory,
      nextLootDepositAt,
      score,
      depositedValue: null,
    };
  }

  if (nextLootDepositAt === null) {
    return {
      inventory,
      nextLootDepositAt: now + lootDepositIntervalMs,
      score,
      depositedValue: null,
    };
  }

  if (now < nextLootDepositAt) {
    return {
      inventory,
      nextLootDepositAt,
      score,
      depositedValue: null,
    };
  }

  const [depositedLoot, ...remainingInventory] = inventory;
  const depositedValue = depositedLoot?.value ?? null;

  return {
    inventory: remainingInventory,
    nextLootDepositAt: remainingInventory.length === 0 ? null : nextLootDepositAt + lootDepositIntervalMs,
    score: score + (depositedValue ?? 0),
    depositedValue,
  };
}