import { describe, expect, it } from 'vitest';
import {
  getHeroAnimationFrameRange,
  getHeroLoopAnimationState,
  getHeroMovementVisualState,
} from './PlaySceneHero';

describe('PlaySceneHero helpers', () => {
  it('maps upper-left movement to mirrored northeast', () => {
    expect(getHeroMovementVisualState(-1, -1)).toEqual({ direction: 'northeast', flipX: true });
  });

  it('maps vertical movement to up without mirroring', () => {
    expect(getHeroMovementVisualState(0, -1)).toEqual({ direction: 'up', flipX: false });
  });

  it('defaults idle vs run loop state from movement intent', () => {
    expect(getHeroLoopAnimationState(true)).toBe('run');
    expect(getHeroLoopAnimationState(false)).toBe('idle');
  });

  it('uses the punch start frame only for punch animations', () => {
    expect(getHeroAnimationFrameRange('punch', 2, 16)).toEqual({ start: 2, end: 15 });
    expect(getHeroAnimationFrameRange('run', 2, 16)).toEqual({ start: 0, end: 15 });
  });
});