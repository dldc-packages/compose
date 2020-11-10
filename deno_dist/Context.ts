import { CONTEXT } from './constants.ts';

export interface ContextConsumer<T, HasDefault extends boolean = boolean> {
  [CONTEXT]: {
    hasDefault: HasDefault;
    defaultValue: T | undefined;
  };
}

export interface ContextProvider<T, HasDefault extends boolean = boolean> {
  [CONTEXT]: {
    consumer: ContextConsumer<T, HasDefault>;
    value: T;
  };
}

export type ContextProviderFn<T, HasDefault extends boolean> = (
  value: T
) => ContextProvider<T, HasDefault>;

// Expose both Provider & Consumer because this way you can expose only one of them
export interface Context<T, HasDefault extends boolean = boolean> {
  Consumer: ContextConsumer<T, HasDefault>;
  Provider: ContextProviderFn<T, HasDefault>;
}

export function createContext<T>(): Context<T, false>;
export function createContext<T>(defaultValue: T): Context<T, true>;
export function createContext<T>(defaultValue?: T): Context<T, boolean> {
  const Consumer: ContextConsumer<T, any> = {
    [CONTEXT]: {
      hasDefault: defaultValue !== undefined && arguments.length > 0,
      defaultValue: defaultValue,
    },
  };
  return {
    Consumer,
    Provider: (value) => ({ [CONTEXT]: { value, consumer: Consumer } }),
  };
}
