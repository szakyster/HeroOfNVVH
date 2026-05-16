export type HeroLoopAnimationState = 'idle' | 'run';
export type HeroLoopAnimationDirection = 'down' | 'northeast' | 'right' | 'southeast' | 'up';
export type HeroPunchAnimationDirection = 'down' | 'right' | 'up';
export type HeroAnimationState = HeroLoopAnimationState | 'punch';
export type HeroAnimationDirection = HeroLoopAnimationDirection | HeroPunchAnimationDirection;

export function getHeroMovementVisualState(
  horizontal: number,
  vertical: number,
): { direction: HeroLoopAnimationDirection; flipX: boolean } {
  if (horizontal < 0 && vertical < 0) {
    return { direction: 'northeast', flipX: true };
  }

  if (horizontal > 0 && vertical < 0) {
    return { direction: 'northeast', flipX: false };
  }

  if (horizontal < 0 && vertical > 0) {
    return { direction: 'southeast', flipX: true };
  }

  if (horizontal > 0 && vertical > 0) {
    return { direction: 'southeast', flipX: false };
  }

  if (horizontal < 0) {
    return { direction: 'right', flipX: true };
  }

  if (horizontal > 0) {
    return { direction: 'right', flipX: false };
  }

  if (vertical < 0) {
    return { direction: 'up', flipX: false };
  }

  return { direction: 'down', flipX: false };
}

export function getHeroLoopAnimationState(isMoving: boolean): HeroLoopAnimationState {
  return isMoving ? 'run' : 'idle';
}

export function getHeroAnimationFrameRange(
  state: HeroAnimationState,
  punchStartFrame: number,
  sheetFrameCount: number,
): { start: number; end: number } {
  return {
    start: state === 'punch' ? punchStartFrame : 0,
    end: sheetFrameCount - 1,
  };
}