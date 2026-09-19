export function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isAppleTouch;
}

export function isNativeFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as any;
  return Boolean(
    el?.requestFullscreen ||
    el?.webkitRequestFullscreen ||
    el?.mozRequestFullScreen ||
    el?.msRequestFullscreen
  );
}

export function isFullscreenSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (isIOSDevice()) return false;
  return isNativeFullscreenSupported();
}

export function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as any;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

export async function requestNativeFullscreen(element: HTMLElement = document.documentElement): Promise<boolean> {
  const el = element as any;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
    if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
      return true;
    }
    if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('Native requestFullscreen failed:', err);
  }
  return false;
}

export async function exitNativeFullscreen(): Promise<boolean> {
  const doc = document as any;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return true;
    }
    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return true;
    }
    if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
      return true;
    }
    if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
      return true;
    }
  } catch (err) {
    console.warn('Native exitFullscreen failed:', err);
  }
  return false;
}

export function addFullscreenChangeListener(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => {};

  const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  events.forEach((evt) => document.addEventListener(evt, callback));

  return () => {
    events.forEach((evt) => document.removeEventListener(evt, callback));
  };
}
