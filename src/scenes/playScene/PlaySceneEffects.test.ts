import { describe, expect, it, vi } from 'vitest';
import {
  destroyEnemyVisuals,
  destroyLootAndFilter,
  showDepositPopup,
  spawnDroppedLoot,
} from './PlaySceneEffects';

describe('PlaySceneEffects helpers', () => {
  it('spawns dropped loot using the configured or default loot texture', () => {
    const shadow = { setDepth: vi.fn().mockReturnThis(), destroy: vi.fn() };
    const body = { setDisplaySize: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), destroy: vi.fn() };
    const add = {
      ellipse: vi.fn(() => shadow),
      image: vi.fn(() => body),
      text: vi.fn(),
    };

    const loot = spawnDroppedLoot({
      add: add as never,
      template: { id: 'loot-1', type: 'wallet', value: 20, image: 'money01.png' },
      droppedLootCount: 2,
      enemyPosition: { x: 300, y: 180 },
      lootSize: { width: 60, height: 40 },
      createdAt: 1250,
    });

    expect(add.image).toHaveBeenCalledWith(300, 184, 'loot:money01.png');
    expect(loot).toMatchObject({ id: 'loot-1-2', type: 'wallet', value: 20, createdAt: 1250 });
  });

  it('creates deposit popups with the expected position and tween target', () => {
    const popup = {
      y: 142,
      destroy: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };
    const add = { text: vi.fn(() => popup) };
    const tweens = { add: vi.fn() };

    expect(
      showDepositPopup({
        add: add as never,
        tweens,
        playerPosition: { x: 320, y: 220 },
        value: 20,
        fontFamily: 'Bungee, Verdana, sans-serif',
      }),
    ).toBe(true);

    expect(add.text).toHaveBeenCalledWith(
      320,
      142,
      '+20 M Ft',
      expect.objectContaining({ fontSize: '34px', color: '#80ed99' }),
    );
    expect(tweens.add).toHaveBeenCalledWith(expect.objectContaining({ targets: popup, y: 88, alpha: 0 }));
  });

  it('does nothing for non-positive deposit popup values', () => {
    expect(
      showDepositPopup({
        add: { text: vi.fn() } as never,
        tweens: { add: vi.fn() },
        playerPosition: { x: 320, y: 220 },
        value: 0,
        fontFamily: 'Bungee, Verdana, sans-serif',
      }),
    ).toBe(false);
  });

  it('destroys loot objects and removes them from the list', () => {
    const firstLoot = {
      id: 'loot-1',
      body: { destroy: vi.fn() },
      shadow: { destroy: vi.fn() },
    };
    const secondLoot = {
      id: 'loot-2',
      body: { destroy: vi.fn() },
      shadow: { destroy: vi.fn() },
    };

    expect(destroyLootAndFilter([firstLoot, secondLoot] as never, firstLoot as never)).toEqual([secondLoot]);
    expect(firstLoot.body.destroy).toHaveBeenCalledTimes(1);
    expect(firstLoot.shadow.destroy).toHaveBeenCalledTimes(1);
  });

  it('destroys enemy visuals as a pair', () => {
    const enemy = {
      body: { destroy: vi.fn() },
      shadow: { destroy: vi.fn() },
    };

    destroyEnemyVisuals(enemy);

    expect(enemy.body.destroy).toHaveBeenCalledTimes(1);
    expect(enemy.shadow.destroy).toHaveBeenCalledTimes(1);
  });
});