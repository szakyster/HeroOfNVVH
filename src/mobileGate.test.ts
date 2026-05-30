import { describe, expect, it, vi } from 'vitest';
import { isMobileClient, renderMobileWarning } from './mobileGate';

function createWindowLike(matches: boolean, userAgent = 'Mozilla/5.0'): Pick<Window, 'matchMedia' | 'navigator'> {
  return {
    matchMedia: vi.fn().mockReturnValue({ matches }),
    navigator: { userAgent } as Navigator,
  };
}

describe('mobile gate', () => {
  it('detects coarse small-screen devices', () => {
    expect(isMobileClient(createWindowLike(true))).toBe(true);
  });

  it('detects mobile user agents even when viewport media does not match', () => {
    expect(isMobileClient(createWindowLike(false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'))).toBe(true);
  });

  it('allows desktop clients', () => {
    expect(isMobileClient(createWindowLike(false))).toBe(false);
  });

  it('renders the mobile warning into the game container', () => {
    const container = { innerHTML: '' } as HTMLElement;

    renderMobileWarning(container);

    expect(container.innerHTML).toContain('mobile-warning');
    expect(container.innerHTML).toContain('mobilon jelenleg nem tamogatott');
  });
});
