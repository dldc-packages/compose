// I: Input
// O: Output
// T: transformed value (returned by next())

export type Next<I, T> = (input: I) => T;
export type Middleware<I, O, T extends O = O> = (input: I, next: Next<I, T>) => O;
export type Middlewares<I, O, T extends O = O> = Array<Middleware<I, O, T>>;

export function composeAdvanced<I, O, T extends O = O>(
  transform: (output: O) => T,
  middlewares: Array<Middleware<I, O, T> | null>
): Middleware<I, O, T> {
  const resolved = middlewares.filter((v): v is Middleware<I, O, T> => v !== null);
  resolved.forEach((middle, index) => {
    if (typeof middle !== 'function') {
      throw new InvalidMiddlewareError(middle, `Not a function at index ${index}`);
    }
  });

  return function (ctx, next): O {
    return dispatch(0, ctx);
    function dispatch(index: number, input: I): O {
      const middle = resolved[index];
      if (!middle) {
        return next(input);
      }
      return middle(input, (ctx) => transform(dispatch(index + 1, ctx)));
    }
  };
}

export function compose<I, O>(...middlewares: Array<Middleware<I, O, O> | null>): Middleware<I, O, O> {
  return composeAdvanced((v) => v, middlewares);
}

export class InvalidMiddlewareError extends Error {
  constructor(public middleware: any, infos: string) {
    super(`Invalid middleware: ${infos}`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
