import { ContextProvider, ContextConsumer } from './Context';
import { MIID_DEBUG, CONTEXT } from './constants';
import { MiidError } from './MiidError';

export class ContextStack {
  private [CONTEXT]: { provider: ContextProvider<any>; parent: null | ContextStack } | null;

  static createEmpty(): ContextStack {
    return new ContextStack();
  }

  private constructor();
  private constructor(provider: ContextProvider<any>, parent: null | ContextStack);
  private constructor(provider?: ContextProvider<any>, parent: null | ContextStack = null) {
    if (provider) {
      this[CONTEXT] = { provider, parent };
    } else {
      this[CONTEXT] = null;
    }
  }

  private readInternal(ctx: ContextConsumer<any, any>): { found: boolean; value: any } {
    const context = this[CONTEXT];
    if (context === null) {
      return {
        found: false,
        value: null
      };
    }
    if (context.provider[CONTEXT].consumer === ctx) {
      return {
        found: true,
        value: context.provider[CONTEXT].value
      };
    }
    if (context.parent === null) {
      return {
        found: false,
        value: null
      };
    }
    return context.parent.readInternal(ctx);
  }

  with(...contexts: Array<ContextProvider<any>>): ContextStack {
    if (contexts.length === 0) {
      return this;
    }
    return [...contexts].reverse().reduce<ContextStack>((parent, provider) => {
      return new ContextStack(provider, parent);
    }, this);
  }

  has(ctx: ContextConsumer<any, any>): boolean {
    return this.readInternal(ctx).found;
  }

  get<T, HasDefault extends boolean>(
    ctx: ContextConsumer<T, HasDefault>
  ): HasDefault extends true ? T : T | null {
    const res = this.readInternal(ctx);
    if (res.found === false) {
      if (ctx[CONTEXT].hasDefault) {
        return ctx[CONTEXT].defaultValue as any;
      }
      return null as any;
    }
    return res.value;
  }

  getOrFail<T>(ctx: ContextConsumer<T>): T {
    const res = this.readInternal(ctx);
    if (res.found === false) {
      console.log(ctx);
      if (ctx[CONTEXT].hasDefault) {
        return ctx[CONTEXT].defaultValue as any;
      }
      throw new MiidError.MissingContext(ctx);
    }
    return res.value;
  }

  debug(): Array<{ value: any; ctxId: string }> {
    const world: any = typeof window !== 'undefined' ? window : global;
    const idMap = world[MIID_DEBUG] || new Map<any, string>();
    if (!world[MIID_DEBUG]) {
      world[MIID_DEBUG] = idMap;
    }
    const result: Array<{ value: any; ctxId: string }> = [];
    const traverse = (stack: ContextStack) => {
      const context = stack[CONTEXT];
      if (context === null) {
        return;
      }
      let ctxId = idMap.get(context.provider[CONTEXT].consumer);
      if (ctxId === undefined) {
        ctxId = Math.random()
          .toString(36)
          .substring(7);
        idMap.set(context.provider[CONTEXT].consumer, ctxId);
      }
      result.push({
        ctxId,
        value: context.provider[CONTEXT].value
      });
      if (context.parent) {
        traverse(context.parent);
      }
    };
    traverse(this);
    return result;
  }
}
