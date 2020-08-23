import { ContextStack } from './ContextStack';
import { MiidError } from './MiidError';
import { ContextProvider } from './Context';

export type Next<R> = (ctx: ContextStack) => Result<R>;
export type Middleware<R> = (ctx: ContextStack, next: Next<R>) => Result<R>;
export type Middlewares<R> = Array<Middleware<R>>;
export type AsyncResult<R> = Promise<R>;
export type Result<R> = R | AsyncResult<R>;

export const Middleware = {
  compose,
  run: runMiddleware,
  runWithContexts: runMiddlewareWithContexts
  // provider: createProviderMiddleware
};

function runMiddleware<R>(middleware: Middleware<R>, done: () => Result<R>): AsyncResult<R> {
  return runMiddlewareWithContexts(middleware, [], done);
}

function runMiddlewareWithContexts<R>(
  middleware: Middleware<R>,
  contexts: Array<ContextProvider<any>>,
  done: () => Result<R>
): AsyncResult<R> {
  const baseStack = ContextStack.createEmpty().with(...contexts);
  return Promise.resolve(middleware(baseStack, done));
}

function compose<R>(...middlewares: Array<Middleware<R> | null>): Middleware<R> {
  const resolved: Array<Middleware<R>> = middlewares.filter(
    (v: Middleware<R> | null): v is Middleware<R> => {
      return v !== null;
    }
  );
  resolved.forEach((middle, index) => {
    if (typeof middle !== 'function') {
      throw new MiidError.InvalidMiddleware(middle, `Not a function at index ${index}`);
    }
  });

  return async function(ctx, next): Promise<R> {
    // last called middleware #
    return dispatch(0, ctx);
    async function dispatch(i: number, context: ContextStack): Promise<R> {
      const middle = resolved[i];
      if (!middle) {
        return next(context);
      }
      const result = middle(context, ctx => dispatch(i + 1, ctx));
      const res = await Promise.resolve<R>(result);
      return res;
    }
  };
}
