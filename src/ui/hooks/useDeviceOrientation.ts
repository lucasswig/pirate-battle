import { useState, useEffect, useCallback } from 'react';

export interface DeviceOrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  lockLandscapeIfSupported: () => Promise<boolean>;
}

export function useDeviceOrientation(): DeviceOrientationState {
  const checkOrientation = useCallback(() => {
    if (typeof window === 'undefined') {
      return { isPortrait: false, isLandscape: true, isMobile: false };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isMobileSize = width < 1024 || height < 600;
    const isMobile = Boolean(hasTouch || isMobileSize);

    let isPortrait = height > width;
    if (window.screen?.orientation?.type) {
      isPortrait = window.screen.orientation.type.startsWith('portrait') || height > width;
    }

    return {
      isPortrait: isMobile && isPortrait,
      isLandscape: !isPortrait || !isMobile,
      isMobile,
    };
  }, []);

  const [state, setState] = useState(() => checkOrientation());

  useEffect(() => {
    const handleUpdate = () => {
      setState(checkOrientation());
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('orientationchange', handleUpdate);

    if (window.screen?.orientation?.addEventListener) {
      window.screen.orientation.addEventListener('change', handleUpdate);
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
      if (window.screen?.orientation?.removeEventListener) {
        window.screen.orientation.removeEventListener('change', handleUpdate);
      }
    };
  }, [checkOrientation]);

  const lockLandscapeIfSupported = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const orientation = window.screen?.orientation as any;
    if (!orientation?.lock) return false;

    try {
      await orientation.lock('landscape');
      return true;
    } catch {
      try {
        await orientation.lock('landscape-primary');
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  return {
    isPortrait: state.isPortrait,
    isLandscape: state.isLandscape,
    isMobile: state.isMobile,
    lockLandscapeIfSupported,
  };
}
