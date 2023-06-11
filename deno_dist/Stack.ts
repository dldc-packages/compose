import { KeyProvider, KeyConsumer } from './Key.ts';
import { MIID_DEBUG, INTERNAL } from './constants.ts';
import { MiidError } from './MiidError.ts';

declare const window: any;

export type StackInternal<Parent extends Stack = Stack> = {
  readonly provider: KeyProvider<any>;
  readonly parent: Parent;
};

export class Stack {
  static applyKeys<T extends Stack>(
    instance: T,
    keys: Array<KeyProvider<any>>,
    instantiate: (internal: StackInternal<T>) => T
  ): T {
    if (keys.length === 0) {
      return instance;
    }
    return [...keys].reverse().reduce<T>((parent, provider) => {
      return instantiate({ parent, provider });
    }, instance);
  }

  private readonly [INTERNAL]: StackInternal | null;

  constructor(internal: StackInternal<Stack> | null = null) {
    this[INTERNAL] = internal;
  }

  protected readInternal(consumer: KeyConsumer<any, any>): { found: boolean; value: any } {
    const internal = this[INTERNAL];
    if (internal === null) {
      return {
        found: false,
        value: null,
      };
    }
    if (internal.provider[INTERNAL].consumer === consumer) {
      return {
        found: true,
        value: internal.provider[INTERNAL].value,
      };
    }
    return internal.parent.readInternal(consumer);
  }

  has(ctx: KeyConsumer<any, any>): boolean {
    return this.readInternal(ctx).found;
  }

  get<T, HasDefault extends boolean>(ctx: KeyConsumer<T, HasDefault>): HasDefault extends true ? T : T | null {
    const res = this.readInternal(ctx);
    if (res.found === false) {
      if (ctx[INTERNAL].hasDefault) {
        return ctx[INTERNAL].defaultValue as any;
      }
      return null as any;
    }
    return res.value;
  }

  getOrFail<T>(consumer: KeyConsumer<T>): T {
    const res = this.readInternal(consumer);
    if (res.found === false) {
      if (consumer[INTERNAL].hasDefault) {
        return consumer[INTERNAL].defaultValue as any;
      }
      throw new MiidError.MissingContext(consumer);
    }
    return res.value;
  }

  debug(): Array<{ value: any; ctxId: string }> {
    // istanbul ignore next
    const world: any = typeof globalThis !== undefined ? globalThis : typeof window !== 'undefined' ? window : global;
    const idMap = world[MIID_DEBUG] || new Map<any, string>();
    if (!world[MIID_DEBUG]) {
      world[MIID_DEBUG] = idMap;
    }
    const result: Array<{ value: any; ctxId: string }> = [];
    const traverse = (stack: Stack) => {
      const internal = stack[INTERNAL];
      if (internal === null) {
        return;
      }
      let ctxId = idMap.get(internal.provider[INTERNAL].consumer);
      if (ctxId === undefined) {
        ctxId = Math.random().toString(36).substring(7);
        idMap.set(internal.provider[INTERNAL].consumer, ctxId);
      }
      result.push({
        ctxId,
        value: internal.provider[INTERNAL].value,
      });
      if (internal.parent) {
        traverse(internal.parent);
      }
    };
    traverse(this);
    return result;
  }

  with(...keys: Array<KeyProvider<any>>): Stack {
    return Stack.applyKeys<Stack>(this, keys, (internal) => new Stack(internal));
  }
}
