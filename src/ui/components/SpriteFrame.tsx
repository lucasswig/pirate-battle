import React, { useState } from 'react';

export const UI_FRAMES: Record<string, { x: number; y: number; w: number; h: number }> = {
  panel_menu: { x: 4, y: 4, w: 384, h: 480 },
  title_pirate_battle: { x: 396, y: 4, w: 384, h: 128 },
  button_primary_disabled: { x: 4, y: 492, w: 256, h: 88 },
  button_primary_hover: { x: 268, y: 492, w: 256, h: 88 },
  button_primary_normal: { x: 532, y: 492, w: 256, h: 88 },
  button_primary_pressed: { x: 4, y: 588, w: 256, h: 88 },
  button_secondary_normal: { x: 268, y: 588, w: 256, h: 88 },
  button_secondary_pressed: { x: 532, y: 588, w: 256, h: 88 },
  button_round_hover: { x: 796, y: 588, w: 64, h: 64 },
  button_round_normal: { x: 868, y: 588, w: 64, h: 64 },
  button_round_pressed: { x: 940, y: 588, w: 64, h: 64 },
  counter_panel: { x: 4, y: 684, w: 160, h: 56 },
  health_fill_amber: { x: 172, y: 684, w: 256, h: 48 },
  health_fill_green: { x: 436, y: 684, w: 256, h: 48 },
  health_fill_red: { x: 700, y: 684, w: 256, h: 48 },
  health_frame: { x: 4, y: 748, w: 256, h: 48 },
  icon_close: { x: 268, y: 748, w: 48, h: 48 },
  icon_fire_front: { x: 324, y: 748, w: 48, h: 48 },
  icon_fire_left: { x: 380, y: 748, w: 48, h: 48 },
  icon_fire_right: { x: 436, y: 748, w: 48, h: 48 },
  icon_forward: { x: 492, y: 748, w: 48, h: 48 },
  icon_heart: { x: 548, y: 748, w: 48, h: 48 },
  icon_home: { x: 604, y: 748, w: 48, h: 48 },
  icon_minus: { x: 660, y: 748, w: 48, h: 48 },
  icon_pause: { x: 716, y: 748, w: 48, h: 48 },
  icon_play: { x: 772, y: 748, w: 48, h: 48 },
  icon_plus: { x: 828, y: 748, w: 48, h: 48 },
  icon_restart: { x: 884, y: 748, w: 48, h: 48 },
  icon_score: { x: 940, y: 748, w: 48, h: 48 },
  icon_settings: { x: 4, y: 804, w: 48, h: 48 },
  icon_time: { x: 60, y: 804, w: 48, h: 48 },
  icon_turn_left: { x: 116, y: 804, w: 48, h: 48 },
  icon_turn_right: { x: 172, y: 804, w: 48, h: 48 },
  enemy_health_fill_green: { x: 228, y: 804, w: 160, h: 40 },
  enemy_health_fill_red: { x: 396, y: 804, w: 160, h: 40 },
  enemy_health_frame: { x: 564, y: 804, w: 160, h: 40 },
};

const SHEET_WIDTH = 1024;
const SHEET_HEIGHT = 1024;

interface SpriteFrameProps {
  name: string;
  className?: string;
  scale?: number;
  style?: React.CSSProperties;
}

export const SpriteFrame: React.FC<SpriteFrameProps> = ({
  name,
  className = '',
  scale = 1,
  style = {},
}) => {
  const frame = UI_FRAMES[name];
  if (!frame) return null;

  return (
    <div
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{
        width: `${frame.w * scale}px`,
        height: `${frame.h * scale}px`,
        backgroundImage: `url('/assets/spritesheet/ui_sheet.png')`,
        backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
        backgroundSize: `${SHEET_WIDTH * scale}px ${SHEET_HEIGHT * scale}px`,
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    />
  );
};

interface RoundButtonProps {
  icon?: string;
  iconSrc?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  title?: string;
  scale?: number;
  iconScale?: number;
  className?: string;
  disabled?: boolean;
  isActive?: boolean;
  'data-testid'?: string;
}

export const RoundButton: React.FC<RoundButtonProps> = ({
  icon,
  iconSrc,
  children,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  title,
  scale = 1,
  iconScale,
  className = '',
  disabled = false,
  isActive = false,
  'data-testid': testId,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleDown = () => {
    if (disabled) return;
    setIsPressed(true);
    if (onPointerDown) onPointerDown();
  };

  const handleUp = () => {
    if (disabled) return;
    setIsPressed(false);
    if (onPointerUp) onPointerUp();
  };

  const handleLeave = () => {
    setIsPressed(false);
    if (onPointerLeave) onPointerLeave();
  };

  const active = (isPressed || isActive) && !disabled;
  const baseFrame = active ? 'button_round_pressed' : 'button_round_normal';
  const effectiveIconScale = iconScale ?? 0.48;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleLeave}
      className={`relative inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:outline-none focus-visible:brightness-110 focus-visible:drop-shadow-[0_0_8px_rgba(251,191,36,0.65)] ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none active:scale-100' : ''
      } ${className}`}
      style={{
        width: `${64 * scale}px`,
        height: `${64 * scale}px`,
      }}
    >
      <SpriteFrame name={baseFrame} scale={scale} />

      {active && (
        <div
          className="absolute rounded-full pointer-events-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-150"
          style={{
            width: `${38 * scale}px`,
            height: `${38 * scale}px`,
            background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 60%, #b45309 100%)',
          }}
        />
      )}

      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none text-pirate-gold"
        style={{
          transform: active ? 'translate(0px, 2px)' : 'none',
        }}
      >
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            className="pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            style={{
              width: `${48 * scale * effectiveIconScale}px`,
              height: `${48 * scale * effectiveIconScale}px`,
              objectFit: 'contain',
            }}
          />
        ) : icon ? (
          <div className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center">
            <SpriteFrame name={icon} scale={scale * effectiveIconScale} />
          </div>
        ) : (
          children
        )}
      </div>
    </button>
  );
};

interface CounterPanelProps {
  icon: 'icon_score' | 'icon_time';
  value: string | number;
  scale?: number;
  testId?: string;
}

export const CounterPanel: React.FC<CounterPanelProps> = ({
  icon,
  value,
  scale = 1,
  testId,
}) => {
  return (
    <div
      className="relative inline-flex items-center justify-center select-none"
      style={{
        width: `${160 * scale}px`,
        height: `${56 * scale}px`,
      }}
      data-testid={testId}
    >
      <SpriteFrame name="counter_panel" scale={scale} className="absolute inset-0" />
      <div className="relative z-10 w-full h-full flex items-center justify-center gap-2.5 px-4">
        <div className="flex-shrink-0 flex items-center justify-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <SpriteFrame name={icon} scale={scale * 0.38} />
        </div>
        <span
          className="font-extrabold font-sans tracking-wider text-[#fffdf2] drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] select-none leading-none"
          style={{ fontSize: `${16 * scale}px` }}
        >
          {value}
        </span>
      </div>
    </div>
  );
};

interface PlayerHealthBarProps {
  current: number;
  max: number;
  scale?: number;
}

export const PlayerHealthBar: React.FC<PlayerHealthBarProps> = ({
  current,
  max,
  scale = 1,
}) => {
  const percent = Math.max(0, Math.min(1, current / max));

  return (
    <div className="relative inline-flex items-center gap-3 select-none" data-testid="player-health-bar">
      <div
        className="flex-shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] flex items-center justify-center"
        style={{
          width: `${48 * scale}px`,
          height: `${48 * scale}px`,
        }}
      >
        <div style={{ transform: `translateY(${1.5 * scale}px)` }}>
          <SpriteFrame name="icon_heart" scale={scale} />
        </div>
      </div>

      <div
        className="relative inline-flex items-center"
        style={{
          width: `${256 * scale}px`,
          height: `${48 * scale}px`,
        }}
      >
        <SpriteFrame name="health_frame" scale={scale} className="absolute inset-0 z-0 pointer-events-none" />

        <div
          className="absolute z-10 overflow-hidden pointer-events-none"
          style={{
            left: `${29 * scale}px`,
            right: `${29 * scale}px`,
            top: `${14 * scale}px`,
            bottom: `${13 * scale}px`,
          }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out bg-gradient-to-b from-[#4ade80] via-[#22c55e] to-[#15803d] relative overflow-hidden"
            style={{ width: `${percent * 100}%` }}
          >
            <div className="absolute inset-x-1 top-0.5 h-[35%] rounded-full bg-white/40 pointer-events-none" />
          </div>
        </div>

        <div
          className="absolute z-20 flex items-center justify-center pointer-events-none"
          style={{
            left: `${29 * scale}px`,
            right: `${29 * scale}px`,
            top: `${14 * scale}px`,
            bottom: `${13 * scale}px`,
          }}
        >
          <span
            className="font-extrabold font-sans text-white tracking-wider drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] leading-none select-none"
            style={{ fontSize: `${13 * scale}px` }}
          >
            {Math.max(0, current)} / {max}
          </span>
        </div>
      </div>
    </div>
  );
};

interface MenuButtonProps {
  text: string;
  onClick?: () => void;
  scale?: number;
  className?: string;
  'data-testid'?: string;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  text,
  onClick,
  scale = 1,
  className = '',
  'data-testid': testId,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const frameName = isPressed
    ? 'button_primary_pressed'
    : isHovered
      ? 'button_primary_hover'
      : 'button_primary_normal';

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onPointerEnter={() => setIsHovered(true)}
      className={`relative inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:outline-none focus-visible:brightness-110 focus-visible:drop-shadow-[0_0_10px_rgba(251,191,36,0.65)] ${className}`}
      style={{
        width: `${256 * scale}px`,
        height: `${88 * scale}px`,
      }}
    >
      <SpriteFrame name={frameName} scale={scale} />
      <span
        className="absolute inset-0 flex items-center justify-center font-black tracking-wider uppercase select-none text-[#331c00] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]"
        style={{
          fontSize: `${Math.max(12, Math.round(21 * scale))}px`,
          transform: isPressed ? 'translate(0px, 3px)' : 'none',
        }}
      >
        {text}
      </span>
    </button>
  );
};

interface SecondaryMenuButtonProps {
  text: string;
  onClick?: () => void;
  scale?: number;
  className?: string;
  'data-testid'?: string;
}

export const SecondaryMenuButton: React.FC<SecondaryMenuButtonProps> = ({
  text,
  onClick,
  scale = 1,
  className = '',
  'data-testid': testId,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const frameName = isPressed ? 'button_secondary_pressed' : 'button_secondary_normal';

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      className={`relative inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:outline-none focus-visible:brightness-110 focus-visible:drop-shadow-[0_0_10px_rgba(251,191,36,0.65)] ${className}`}
      style={{
        width: `${256 * scale}px`,
        height: `${88 * scale}px`,
      }}
    >
      <SpriteFrame name={frameName} scale={scale} />
      <span
        className="absolute inset-0 flex items-center justify-center font-bold tracking-wider uppercase select-none text-pirate-parchment drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-2 whitespace-nowrap"
        style={{
          fontSize: `${Math.max(11, Math.round(15 * scale))}px`,
          transform: isPressed ? 'translate(0px, 2px)' : 'none',
        }}
      >
        {text}
      </span>
    </button>
  );
};

interface TabButtonProps {
  text: string;
  isActive: boolean;
  onClick: () => void;
  scale?: number;
  className?: string;
  'data-testid'?: string;
}

export const TabButton: React.FC<TabButtonProps> = ({
  text,
  isActive,
  onClick,
  scale = 0.7,
  className = '',
  'data-testid': testId,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const frameName = isActive
    ? isPressed
      ? 'button_primary_pressed'
      : 'button_primary_normal'
    : isPressed
      ? 'button_secondary_pressed'
      : 'button_secondary_normal';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-testid={testId}
      onClick={onClick}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      className={`relative inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:outline-none focus-visible:brightness-110 focus-visible:drop-shadow-[0_0_10px_rgba(251,191,36,0.65)] ${className}`}
      style={{
        width: `${256 * scale}px`,
        height: `${88 * scale}px`,
      }}
    >
      <SpriteFrame name={frameName} scale={scale} />
      <span
        className={`absolute inset-0 flex items-center justify-center font-black tracking-wider uppercase select-none px-2 whitespace-nowrap antialiased ${
          isActive
            ? 'text-[#331c00] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]'
            : 'text-pirate-parchment drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
        }`}
        style={{
          fontSize: `${Math.max(11, Math.round(21 * scale))}px`,
          transform: isPressed ? 'translate(0px, 2px)' : 'none',
        }}
      >
        {text}
      </span>
    </button>
  );
};

