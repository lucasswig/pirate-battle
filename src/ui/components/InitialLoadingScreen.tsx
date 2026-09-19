import React, { useEffect, useState } from 'react';
import { AssetManager } from '../../game/core/AssetManager';
import { MinimalLoader } from './MinimalLoader';

interface InitialLoadingScreenProps {
  onFinish: () => void;
}

const CRITICAL_IMAGES = [
  '/assets/ui_scene_background.png',
  '/assets/spritesheet/ui_sheet.png',
  '/assets/png/default/ui/menu/panel_menu.png',
  '/assets/png/default/ships/ship_2.png',
  '/assets/logo_jungle_gaming.svg',
];

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
}

export const InitialLoadingScreen: React.FC<InitialLoadingScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadAll() {
      const imagePromises = CRITICAL_IMAGES.map((src) => preloadImage(src));
      const assetManagerPromise = AssetManager.getInstance()
        .loadAssets()
        .catch(() => {});

      await Promise.all([...imagePromises, assetManagerPromise]);

      if (isCancelled) return;

      const readyTimer = setTimeout(() => {
        if (isCancelled) return;
        setIsFadingOut(true);

        const unmountTimer = setTimeout(() => {
          if (!isCancelled) {
            onFinish();
          }
        }, 400);

        return () => clearTimeout(unmountTimer);
      }, 150);

      return () => clearTimeout(readyTimer);
    }

    loadAll();

    return () => {
      isCancelled = true;
    };
  }, [onFinish]);

  return (
    <MinimalLoader
      isFixed
      className={`transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    />
  );
};
