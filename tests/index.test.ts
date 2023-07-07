import { expect, test, vi } from 'vitest';
import { InvalidMiddlewareError, compose } from '../src/mod';

type MaybeAsync<T> = T | Promise<T>;

test('compose', async () => {
  const mock = vi.fn();

  const mid = compose<number, MaybeAsync<string>>(
    (ctx, next) => {
      mock('middleware 1', ctx);
      return next(ctx + 1);
    },
    (ctx, next) => {
      mock('middleware 2', ctx);
      return next(ctx + 1);
    },
    (ctx, next) => {
      mock('middleware 3', ctx);
      return next(ctx + 1);
    },
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

  const res = await mid3(0, () => {
    mock('done 2');
    return 'nope2';
  });

  expect(mock.mock.calls).toEqual([
    ['middleware 1', 0],
    ['middleware 2', 1],
    ['middleware 3', 2],
    ['done'],
    ['done 2'],
    ['tmp nope2'],
  ]);
  expect(res).toBe('nope2');
});

test('Compose should throw on invalid middleware type', () => {
  expect(() => compose({} as any)).toThrow(InvalidMiddlewareError);
});
