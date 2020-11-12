import { ContextStack } from './ContextStack';
import { MiidError } from './MiidError';

export type Next<N> = (ctx: ContextStack) => N;
export type Middleware<R, N = R> = (ctx: ContextStack, next: Next<N>) => R;
export type Middlewares<R, N = R> = Array<Middleware<R, N>>;

export function composeAdvanced<R, N>(
  transform: (result: R) => N,
  middlewares: Array<Middleware<R, N> | null>
): Middleware<N, R> {
  const resolved: Array<Middleware<R, N>> = middlewares.filter(
    (v: Middleware<R, N> | null): v is Middleware<R, N> => {
      return v !== null;
    }
  );
  resolved.forEach((middle, index) => {
    if (typeof middle !== 'function') {
      throw new MiidError.InvalidMiddleware(middle, `Not a function at index ${index}`);
    }
  });

  return function (ctx, next): N {
    return dispatch(0, ctx);
    function dispatch(i: number, context: ContextStack): N {
      const middle = resolved[i];
      if (!middle) {
        return transform(next(context));
      }
      return transform(middle(context, (ctx) => dispatch(i + 1, ctx)));
    }
  };
}

export function compose<R>(...middlewares: Array<Middleware<R> | null>): Middleware<R> {
  return composeAdvanced((v) => v, middlewares);
}
