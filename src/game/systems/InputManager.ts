export interface InputState {
  forward: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  fireFront: boolean;
  fireBroadsideLeft: boolean;
  fireBroadsideRight: boolean;
}

export class InputManager {
  private activeKeys: Set<string> = new Set();
  private virtualState: Partial<InputState> = {};
  private isEnabled = true;

  private onKeyDownBound = this.onKeyDown.bind(this);
  private onKeyUpBound = this.onKeyUp.bind(this);
  private onBlurBound = this.onBlur.bind(this);

  constructor() {
    this.attachListeners();
  }

  private attachListeners(): void {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('blur', this.onBlurBound);
  }

  public detachListeners(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('blur', this.onBlurBound);
    this.clear();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    const key = e.code;
    const isGameplayKey = [
      'ArrowUp', 'KeyW',
      'ArrowLeft', 'KeyA',
      'ArrowRight', 'KeyD',
      'Space',
      'KeyQ',
      'KeyE',
    ].includes(key);

    if (isGameplayKey) {
      e.preventDefault();
      this.activeKeys.add(key);
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.activeKeys.delete(e.code);
  }

  private onBlur(): void {
    this.clear();
  }

  public setVirtualInput(input: Partial<InputState>): void {
    this.virtualState = { ...this.virtualState, ...input };
  }

  public getInputState(): InputState {
    if (!this.isEnabled) {
      return {
        forward: false,
        turnLeft: false,
        turnRight: false,
        fireFront: false,
        fireBroadsideLeft: false,
        fireBroadsideRight: false,
      };
    }

    const forward = this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp') || !!this.virtualState.forward;
    const turnLeft = this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft') || !!this.virtualState.turnLeft;
    const turnRight = this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight') || !!this.virtualState.turnRight;
    const fireFront = this.activeKeys.has('Space') || !!this.virtualState.fireFront;
    const fireBroadsideLeft = this.activeKeys.has('KeyQ') || !!this.virtualState.fireBroadsideLeft;
    const fireBroadsideRight = this.activeKeys.has('KeyE') || !!this.virtualState.fireBroadsideRight;

    return {
      forward,
      turnLeft,
      turnRight,
      fireFront,
      fireBroadsideLeft,
      fireBroadsideRight,
    };
  }

  public clear(): void {
    this.activeKeys.clear();
    this.virtualState = {};
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}
