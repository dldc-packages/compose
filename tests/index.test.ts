import { describe, expect, test, vi } from 'vitest';
import { KeyProvider, MiidError, Stack, StackInternal, compose, createKey } from '../src/mod';

type MaybeAsync<T> = T | Promise<T>;

describe('Stack', () => {
  test('new Stack()', () => {
    expect(new Stack()).toBeInstanceOf(Stack);
  });

  test(`Context with 0 should return self`, () => {
    const Ctx = createKey<string>({ name: 'Ctx' });
    const ctx = new Stack().with(Ctx.Provider(''));
    expect(ctx.with()).toBe(ctx);
  });

  test('Context with default', () => {
    const CtxWithDefault = createKey<string>({
      name: 'CtxWithDefault',
      defaultValue: 'DEFAULT',
    });
    const emptyCtx = new Stack();
    expect(emptyCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.has(CtxWithDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxWithDefault.Provider('A'));
    expect(ctx.get(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxWithDefault.Consumer)).toBe(true);
    const OtherCtx = createKey<string>({ name: 'OtherCtx' });
    const otherCtx = emptyCtx.with(OtherCtx.Provider('other'));
    expect(otherCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.has(CtxWithDefault.Consumer)).toBe(false);
  });

  test('Context without default', () => {
    const CtxNoDefault = createKey<string>({ name: 'CtxNoDefault' });
    const emptyCtx = new Stack();
    expect(emptyCtx.get(CtxNoDefault.Consumer)).toBe(null);
    expect(() => emptyCtx.getOrFail(CtxNoDefault.Consumer)).toThrow();
    expect(emptyCtx.has(CtxNoDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxNoDefault.Provider('A'));
    expect(ctx.get(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxNoDefault.Consumer)).toBe(true);
  });

  test('Custom Stack', () => {
    class CustomStack extends Stack {
      // You need to override the `with` method to return a new instance of your CustomStack
      with(...keys: Array<KeyProvider<any>>): CustomStack {
        // Use the static `applyKeys` method to apply keys to the current instance
        return Stack.applyKeys<CustomStack>(this, keys, (internal) => new CustomStack(internal));
      }
    }

    const custom = new CustomStack();
    expect(custom instanceof CustomStack).toBe(true);
    expect(custom instanceof Stack).toBe(true);
    const Ctx = createKey<string>({ name: 'Ctx' });
    const next = custom.with(Ctx.Provider('ok'));
    expect(next instanceof CustomStack).toBe(true);
    expect(next instanceof Stack).toBe(true);
  });
});

test('CustomStackWithParams', () => {
  class ParamsStack extends Stack {
    // You can pass your own parameters to the constructor
    constructor(public readonly param: string, internal: StackInternal<ParamsStack> | null = null) {
      super(internal);
    }

    with(...keys: Array<KeyProvider<any>>): ParamsStack {
      return Stack.applyKeys<ParamsStack>(this, keys, (internal) => new ParamsStack(this.param, internal));
    }
  }

  const custom = new ParamsStack('some value');
  expect(custom.param).toBe('some value');
  expect(custom instanceof ParamsStack).toBe(true);
  expect(custom instanceof Stack).toBe(true);
});

test('compose', async () => {
  const ACtx = createKey<string>({ name: 'ACtx', defaultValue: 'A' });

  const mock = vi.fn();

  const mid = compose<Stack, MaybeAsync<string>>(
    (ctx, next) => {
      mock('middleware 1');
      return next(ctx.with(ACtx.Provider('a1')));
    },
    (ctx, next) => {
      mock('middleware 2');
      return next(ctx.with(ACtx.Provider('a2')));
    },
    (ctx, next) => {
      mock('middleware 3');
      mock(ctx.get(ACtx.Consumer));
      return next(ctx.with(ACtx.Provider('a3')));
    }
  );

  const mid2 = compose(mid, async (ctx, next) => {
    mock('done');
    return next(ctx);
  });

  const mid3 = compose(mid2, async (ctx, next) => {
    const tmp = await Promise.resolve(next(ctx));
    mock('tmp ' + tmp);
    return tmp;
  });

  const res = await mid3(new Stack(), () => {
    mock('done 2');
    return 'nope2';
  });

  expect(mock.mock.calls).toEqual([
    ['middleware 1'],
    ['middleware 2'],
    ['middleware 3'],
    ['a2'],
    ['done'],
    ['done 2'],
    ['tmp nope2'],
  ]);
  expect(res).toBe('nope2');
});

test('create empty stack', () => {
  expect(new Stack()).toBeInstanceOf(Stack);
});

test('Compose should throw on invalid middleware type', () => {
  expect(() => compose({} as any)).toThrow(MiidError.InvalidMiddleware);
});

test('Debug context', () => {
  const ACtx = createKey<string>({ name: 'ACtx', defaultValue: 'A' });
  const BCtx = createKey<string>({ name: 'BCtx', defaultValue: 'B' });
  const ctx = new Stack().with(ACtx.Provider('a1'), BCtx.Provider('b1'), ACtx.Provider('a2'));
  expect(ctx.debug()).toMatchObject([{ value: 'a1' }, { value: 'b1' }, { value: 'a2' }]);
});

test('compile README example', () => {
  const originalLog = console.log;
  console.log = vi.fn();

  const ACtx = createKey<string>({ name: 'ACtx', defaultValue: 'A' });

  const mid = compose<Stack, string>(
    (ctx, next) => {
      console.log('middleware 1');
      console.log(ctx.debug());
      return next(ctx.with(ACtx.Provider('a1')));
    },
    (ctx, next) => {
      console.log('middleware 2');
      console.log(ctx.debug());
      return next(ctx.with(ACtx.Provider('a2')));
    },
    (ctx, next) => {
      console.log('middleware 3');
      console.log(ctx.get(ACtx.Consumer));
      console.log(ctx.debug());
      return next(ctx.with(ACtx.Provider('a3')));
    }
  );
  const mid2 = compose(mid, (ctx, next) => {
    console.log('done');
    console.log(ctx.debug());
    return next(ctx);
  });
  mid2(new Stack(), () => {
    console.log('done 2');
    return 'nope2';
  });

  console.log = originalLog;
});
