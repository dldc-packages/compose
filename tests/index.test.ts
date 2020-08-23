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

test('Read context or fail', () => {
  const ACtx = Context.create<string>('A');
  const BCtx = Context.create<string>();
  const ctx = ContextStack.createEmpty().with(ACtx.Provider('a1'));
  expect(() => ctx.getOrFail(ACtx.Consumer)).not.toThrow();
  expect(() => ctx.getOrFail(BCtx.Consumer)).toThrow();
  expect(() => ContextStack.createEmpty().getOrFail(ACtx.Consumer)).not.toThrow();
});
