import { Middleware, Context, ContextStack, MiidError } from '../src';

test('compose', async () => {
  const ACtx = Context.create<string>('A');

  const mock = jest.fn();

  const mid = Middleware.compose<string>(
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

  const mid2 = Middleware.compose(mid, async (ctx, next) => {
    mock('done');
    return next(ctx);
  });

  const res = await Middleware.run(mid2, () => {
    mock('done 2');
    return 'nope2';
  });

  expect(mock.mock.calls).toEqual([
    ['middleware 1'],
    ['middleware 2'],
    ['middleware 3'],
    ['a2'],
    ['done'],
    ['done 2']
  ]);
  expect(res).toBe('nope2');
});

test('create empty stack', () => {
  expect(ContextStack.createEmpty()).toBeInstanceOf(ContextStack);
});

test('Compose should throw on invalid middleware type', () => {
  const composed = () => Middleware.compose({} as any);
  expect(() => Middleware.run(composed, () => null)).toThrow(MiidError.InvalidMiddleware);
});

test('Debug context', () => {
  const ACtx = Context.create<string>('A');
  const BCtx = Context.create<string>('B');
  const ctx = ContextStack.createEmpty().with(
    ACtx.Provider('a1'),
    BCtx.Provider('b1'),
    ACtx.Provider('a2')
  );
  expect(ctx.debug()).toMatchObject([{ value: 'a1' }, { value: 'b1' }, { value: 'a2' }]);
});

describe('ContextStack', () => {
  test('ContextStack.createEmpty', () => {
    expect(ContextStack.createEmpty()).toBeInstanceOf(ContextStack);
  });

  test(`Creating a ContextStack with a provider but no parent throws`, () => {
    const Ctx = Context.create<string>();
    expect(() => new (ContextStack as any)(Ctx.Provider(''))).toThrow();
  });

  test('Context with default', () => {
    const CtxWithDefault = Context.create<string>('DEFAULT');
    const emptyCtx = ContextStack.createEmpty();
    expect(emptyCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.has(CtxWithDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxWithDefault.Provider('A'));
    expect(ctx.get(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxWithDefault.Consumer)).toBe(true);
    const OtherCtx = Context.create<string>();
    const otherCtx = emptyCtx.with(OtherCtx.Provider('other'));
    expect(otherCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.has(CtxWithDefault.Consumer)).toBe(false);
  });

  test('Context without default', () => {
    const CtxNoDefault = Context.create<string>();
    const emptyCtx = ContextStack.createEmpty();
    expect(emptyCtx.get(CtxNoDefault.Consumer)).toBe(null);
    expect(() => emptyCtx.getOrFail(CtxNoDefault.Consumer)).toThrow();
    expect(emptyCtx.has(CtxNoDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxNoDefault.Provider('A'));
    expect(ctx.get(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxNoDefault.Consumer)).toBe(true);
  });
});
