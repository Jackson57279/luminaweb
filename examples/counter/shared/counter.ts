export type CounterState = {
  value: number;
  updatedAt: string;
};

const DEFAULT_STATE: CounterState = { value: 0, updatedAt: new Date(0).toISOString() };

export function defaultState(): CounterState {
  return { ...DEFAULT_STATE, updatedAt: new Date(0).toISOString() };
}
