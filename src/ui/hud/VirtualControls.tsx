import React, { useRef, useState, useCallback } from 'react';
import { InputManager } from '@/game/systems/InputManager';
import { RoundButton } from '../components/SpriteFrame';

interface VirtualControlsProps {
  inputManager: InputManager | null;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ inputManager }) => {
  const steeringRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});

  const setInput = useCallback(
    (key: string, pressed: boolean) => {
      if (!inputManager) return;
      setPressedKeys((prev) => {
        if (prev[key] === pressed) return prev;
        return { ...prev, [key]: pressed };
      });
      inputManager.setVirtualInput({ [key]: pressed });
    },
    [inputManager]
  );

  const evaluateSteeringTouch = (clientX: number, clientY: number) => {
    if (!steeringRef.current) return;
    const rect = steeringRef.current.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;

    const isForward = ny < 0.62 && nx >= 0.18 && nx <= 0.82;
    const isTurnLeft = nx < 0.46;
    const isTurnRight = nx > 0.54;

    setInput('forward', isForward);
    setInput('turnLeft', isTurnLeft);
    setInput('turnRight', isTurnRight);
  };

  const handleSteeringPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    evaluateSteeringTouch(e.clientX, e.clientY);
  };

  const handleSteeringPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      evaluateSteeringTouch(e.clientX, e.clientY);
    }
  };

  const handleSteeringPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      activePointerIdRef.current = null;
      setInput('forward', false);
      setInput('turnLeft', false);
      setInput('turnRight', false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-3 sm:p-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] z-20 select-none touch-none lg:hidden">
      <div className="flex items-end justify-between w-full pointer-events-none">
        <div
          ref={steeringRef}
          onPointerDown={handleSteeringPointerDown}
          onPointerMove={handleSteeringPointerMove}
          onPointerUp={handleSteeringPointerEnd}
          onPointerCancel={handleSteeringPointerEnd}
          className="relative pointer-events-auto flex items-end gap-3 p-1 touch-none origin-bottom-left scale-90 sm:scale-100"
        >
          <RoundButton
            icon="icon_turn_left"
            title="Turn Port (Left)"
            scale={1.15}
            data-testid="ctrl-turn-left"
            isActive={pressedKeys.turnLeft}
            onPointerDown={() => setInput('turnLeft', true)}
            onPointerUp={() => setInput('turnLeft', false)}
            onPointerLeave={() => setInput('turnLeft', false)}
          />

          <div className="-translate-y-4">
            <RoundButton
              icon="icon_forward"
              title="Full Sails (Forward)"
              scale={1.15}
              data-testid="ctrl-forward"
              isActive={pressedKeys.forward}
              onPointerDown={() => setInput('forward', true)}
              onPointerUp={() => setInput('forward', false)}
              onPointerLeave={() => setInput('forward', false)}
            />
          </div>

          <RoundButton
            icon="icon_turn_right"
            title="Turn Starboard (Right)"
            scale={1.15}
            data-testid="ctrl-turn-right"
            isActive={pressedKeys.turnRight}
            onPointerDown={() => setInput('turnRight', true)}
            onPointerUp={() => setInput('turnRight', false)}
            onPointerLeave={() => setInput('turnRight', false)}
          />
        </div>

        <div className="relative pointer-events-auto flex items-end gap-3 p-1 touch-none origin-bottom-right scale-90 sm:scale-100">
          <RoundButton
            icon="icon_fire_left"
            title="Fire Port Broadside (Q)"
            scale={1.05}
            data-testid="ctrl-broadside-left"
            isActive={pressedKeys.fireBroadsideLeft}
            onPointerDown={() => setInput('fireBroadsideLeft', true)}
            onPointerUp={() => setInput('fireBroadsideLeft', false)}
            onPointerLeave={() => setInput('fireBroadsideLeft', false)}
          />

          <div className="-translate-y-3">
            <RoundButton
              icon="icon_fire_front"
              title="Fire Bow Cannon (Space)"
              scale={1.25}
              data-testid="ctrl-bow-cannon"
              isActive={pressedKeys.fireFront}
              onPointerDown={() => setInput('fireFront', true)}
              onPointerUp={() => setInput('fireFront', false)}
              onPointerLeave={() => setInput('fireFront', false)}
            />
          </div>

          <RoundButton
            icon="icon_fire_right"
            title="Fire Starboard Broadside (E)"
            scale={1.05}
            data-testid="ctrl-broadside-right"
            isActive={pressedKeys.fireBroadsideRight}
            onPointerDown={() => setInput('fireBroadsideRight', true)}
            onPointerUp={() => setInput('fireBroadsideRight', false)}
            onPointerLeave={() => setInput('fireBroadsideRight', false)}
          />
        </div>
      </div>
    </div>
  );
};
