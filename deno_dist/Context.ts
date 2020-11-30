import { CONTEXT } from './constants.ts';

export interface ContextConsumer<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [CONTEXT]: {
    hasDefault: HasDefault;
    defaultValue: T | undefined;
    help?: string;
  };
}

export interface ContextProvider<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [CONTEXT]: {
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

export function createContext<T>(options: {
  name: string;
  help?: string;
  defaultValue: T;
}): Context<T, true>;
export function createContext<T>(options: { name: string; help?: string }): Context<T, false>;
export function createContext<T>(options: {
  name: string;
  help?: string;
  defaultValue?: T;
}): Context<T, boolean> {
  const { help, name } = options;
  const Consumer: ContextConsumer<T, any> = {
    name,
    [CONTEXT]: {
      hasDefault: options.defaultValue !== undefined,
      defaultValue: options.defaultValue,
      help,
    },
  };
  return {
    Consumer,
    Provider: (value) => ({ name, [CONTEXT]: { value, consumer: Consumer } }),
  };
}
