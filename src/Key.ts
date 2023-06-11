import { INTERNAL } from './constants';

export interface KeyConsumer<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    hasDefault: HasDefault;
    defaultValue: T | undefined;
    help?: string;
  };
}

export interface KeyProvider<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    consumer: KeyConsumer<T, HasDefault>;
    value: T;
  };
}

export type KeyProviderFn<T, HasDefault extends boolean> = (value: T) => KeyProvider<T, HasDefault>;

// Expose both Provider & Consumer because this way you can expose only one of them
export interface Key<T, HasDefault extends boolean = boolean> {
  Consumer: KeyConsumer<T, HasDefault>;
  Provider: KeyProviderFn<T, HasDefault>;
}

export function createKey<T>(options: { name: string; help?: string; defaultValue: T }): Key<T, true>;
export function createKey<T>(options: { name: string; help?: string }): Key<T, false>;
export function createKey<T>(options: { name: string; help?: string; defaultValue?: T }): Key<T, boolean> {
  const { help, name } = options;
  const Consumer: KeyConsumer<T, any> = {
    name,
    [INTERNAL]: {
      hasDefault: options.defaultValue !== undefined,
      defaultValue: options.defaultValue,
      help,
    },
  };
  return {
    Consumer,
    Provider: (value) => ({ name, [INTERNAL]: { value, consumer: Consumer } }),
  };
}
