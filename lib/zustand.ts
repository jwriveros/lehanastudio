import { useSyncExternalStore } from "react";

type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
type GetState<T> = () => T;
type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

type UseStore<T> = (() => T) & {
  getState: GetState<T>;
};

export function create<T>(creator: StateCreator<T>): UseStore<T> {
  let state = {} as T;
  const listeners = new Set<() => void>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial) => {
    const nextState =
      typeof partial === "function" ? (partial as (s: T) => T | Partial<T>)(state) : partial;

    state = {
      ...state,
      ...(nextState as T),
    };
    listeners.forEach((listener) => listener());
  };

  state = creator(setState, getState);

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = () => useSyncExternalStore(subscribe, () => state, () => state);
  (useStore as UseStore<T>).getState = getState;
  return useStore as UseStore<T>;
}
