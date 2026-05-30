const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function isMobileClient(browserWindow: Pick<Window, 'matchMedia' | 'navigator'>): boolean {
  const hasMobileViewport = browserWindow.matchMedia('(max-width: 900px) and (pointer: coarse)').matches;
  const hasMobileUserAgent = MOBILE_USER_AGENT_PATTERN.test(browserWindow.navigator.userAgent);

  return hasMobileViewport || hasMobileUserAgent;
}

export function renderMobileWarning(container: HTMLElement): void {
  container.innerHTML = `
    <section class="mobile-warning" aria-live="polite">
      <h1>Asztali gepen jatszhato</h1>
      <p>Ez a jatek mobilon jelenleg nem tamogatott. Nyisd meg laptopon vagy asztali gepen.</p>
    </section>
  `;
}
