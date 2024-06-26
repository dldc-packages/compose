import { createErreurStore, type TErreurStore } from "@dldc/erreur";

// I: Input
// O: Output
// T: transformed value (returned by next())

export type INext<I, T> = (input: I) => T;
export type IMiddleware<I, O, T extends O = O> = (
  input: I,
  next: INext<I, T>,
) => O;
export type IMiddlewares<I, O, T extends O = O> = Array<IMiddleware<I, O, T>>;

export function composeAdvanced<I, O, T extends O = O>(
  transform: (output: O) => T,
  middlewares: Array<IMiddleware<I, O, T> | null>,
): IMiddleware<I, O, T> {
  const resolved = middlewares.filter((v): v is IMiddleware<I, O, T> =>
    v !== null
  );
  resolved.forEach((middle, index) => {
    if (typeof middle !== "function") {
      throw createInvalidMiddlewareError(
        middle,
        `Not a function at index ${index}`,
      );
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

export function compose<I, O>(
  ...middlewares: Array<IMiddleware<I, O, O> | null>
): IMiddleware<I, O, O> {
  return composeAdvanced((v) => v, middlewares);
}

export type TInvalidMiddlewareErreurData = {
  middleware: unknown;
  infos: string;
};

const InvalidMiddlewareErreurInternal: TErreurStore<
  TInvalidMiddlewareErreurData
> = createErreurStore<
  TInvalidMiddlewareErreurData
>();

/**
 * Use this to detect when an error comes from the compose function
 *
 * ```ts
 * InvalidMiddlewareErreur.has(err)
 * InvalidMiddlewareErreur.get(err)
 * ```
 */
export const InvalidMiddlewareErreur =
  InvalidMiddlewareErreurInternal.asReadonly;

function createInvalidMiddlewareError(middleware: unknown, infos: string) {
  return InvalidMiddlewareErreurInternal.setAndThrow(
    `Invalid middleware: ${infos}`,
    { middleware, infos },
  );
}
