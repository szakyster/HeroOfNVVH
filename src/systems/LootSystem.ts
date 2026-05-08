export type LootConfig = {
  maxInventory: number;
  lifetimeMs: number;
  blinkStartMs: number;
};

export const DEFAULT_LOOT_CONFIG: LootConfig = {
  maxInventory: 4,
  lifetimeMs: 5000,
  blinkStartMs: 1500,
};

export function isInventoryFull(
  inventoryCount: number,
  config: LootConfig = DEFAULT_LOOT_CONFIG,
): boolean {
  return inventoryCount >= config.maxInventory;
}

export function isLootExpired(
  createdAt: number,
  now: number,
  config: LootConfig = DEFAULT_LOOT_CONFIG,
): boolean {
  return now - createdAt >= config.lifetimeMs;
}

export function shouldLootBlink(
  createdAt: number,
  now: number,
  config: LootConfig = DEFAULT_LOOT_CONFIG,
): boolean {
  return now - createdAt >= config.lifetimeMs - config.blinkStartMs;
}

export function getLootAlpha(
  createdAt: number,
  now: number,
  config: LootConfig = DEFAULT_LOOT_CONFIG,
): number {
  if (!shouldLootBlink(createdAt, now, config)) {
    return 1;
  }

  const blinkElapsed = now - (createdAt + config.lifetimeMs - config.blinkStartMs);
  return Math.floor(blinkElapsed / 150) % 2 === 0 ? 1 : 0.2;
}