import { MswNetworkScenario } from '../api/types';

const SCENARIO_STORAGE_KEY = 'pirate_msw_scenario';

export const DEFAULT_SCENARIO: MswNetworkScenario = 'DEFAULT';

export const getStoredScenario = (): MswNetworkScenario => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SCENARIO_STORAGE_KEY) as MswNetworkScenario | null;
      if (stored) return stored;
    }
    return DEFAULT_SCENARIO;
  } catch {
    return DEFAULT_SCENARIO;
  }
};

export const setStoredScenario = (scenario: MswNetworkScenario): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SCENARIO_STORAGE_KEY, scenario);
      window.dispatchEvent(new CustomEvent('msw-scenario-changed', { detail: scenario }));
    }
  } catch {}
};

export const resetStoredScenario = (): void => {
  setStoredScenario('DEFAULT');
};

if (typeof window !== 'undefined') {
  (window as any).__setMswScenario = (scenario: MswNetworkScenario) => {
    setStoredScenario(scenario);
  };
  (window as any).__getMswScenario = () => {
    return getStoredScenario();
  };
}
