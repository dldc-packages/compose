import { Middleware, Context } from '../src';

test('compose', async () => {
  const ACtx = Context.create<string>('A');

  const mock = jest.fn();

  const mid = Middleware.compose<string>(
    tools => {
      mock('middleware 1');
      return tools.withContext(ACtx.Provider('a1')).next();
    },
    tools => {
      mock('middleware 2');
      return tools.withContext(ACtx.Provider('a2')).next();
    },
    tools => {
      mock('middleware 3');
      mock(tools.readContext(ACtx.Consumer));
      return tools.withContext(ACtx.Provider('a3')).next();
    }
  );

  const mid2 = Middleware.compose(mid, async tools => {
    mock('done');
    return tools.next();
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
