# 🔗 Compose

> A type-safe middleware system

`@dldc/compose` lets you build a pipeline out of small middleware functions.
Each middleware receives the input and a `next` function, and can transform the
input before handing it to the middleware after it.

## Installation

```bash
npm install @dldc/compose
```

## Usage

```ts
import { compose } from "@dldc/compose";

const pipeline = compose<number, number>(
  (ctx, next) => {
    console.log("middleware 1", ctx); // middleware 1 0
    return next(ctx + 1);
  },
  (ctx, next) => {
    console.log("middleware 2", ctx); // middleware 2 1
    return next(ctx + 1);
  },
);

const result = pipeline(0, (ctx) => ctx);
console.log(result); // 2
```

A middleware is a function of `(input, next)`:

- `input` is the current value, passed down from the middleware before it.
- `next` calls the rest of the pipeline with a (possibly transformed) input.
- The returned value is what the pipeline produces at that level.

The function you call (the composed middleware) takes the initial input and the
last `next`, whose return value becomes the result of the pipeline.

Middlewares can be `async` — just make sure the `next` call is awaited (or
returned) and the final result is awaited:

```ts
import { compose } from "@dldc/compose";

const pipeline = compose<number, Promise<number>>(
  async (ctx, next) => next(ctx + 1),
  async (ctx, next) => next(ctx * 2),
);

const result = await pipeline(0, async (ctx) => ctx);
console.log(result); // 2
```

## `composeAdvanced`

`composeAdvanced` is the general form that `compose` is built on — `compose` is
exactly `composeAdvanced((output) => output, middlewares)`. On top of
`compose`, it takes a `transform` that narrows the output type: the result
produced by the remaining middlewares has type `O`, and the value a middleware
receives from `next(...)` has type `T` (with `T extends O`).

In this example the middlewares may signal "no value" by returning `null`, and
the `transform` turns that back into a concrete number — so `next(...)` is
*always* typed `number`, never `null`:

```ts
import { composeAdvanced } from "@dldc/compose";

const pipeline = composeAdvanced<number, number | null, number>(
  (output) => output ?? 0,
  [
    (ctx, next) => next(ctx + 1),
    (ctx, next) => {
      // `next` is typed to return `number` (never `null`)
      const value: number = next(ctx);
      return value > 10 ? null : value;
    },
  ],
);

const result = pipeline(0, (ctx) => ctx);
console.log(result); // 1
```

## Handling invalid middleware

`compose` expects every middleware to be a function. Passing anything else
throws an error that you can detect and inspect with `InvalidMiddlewareErreur`:

```ts
import { compose, InvalidMiddlewareErreur } from "@dldc/compose";

try {
  compose({} as any);
} catch (error) {
  if (InvalidMiddlewareErreur.has(error)) {
    console.log(InvalidMiddlewareErreur.get(error));
    // { middleware: {}, infos: "Not a function at index 0" }
  }
}
```

## Types

- `INext<I, T>` — the `next` function: `(input: I) => T`
- `IMiddleware<I, O, T extends O = O>` — a middleware: `(input: I, next: INext<I, T>) => O`
- `IMiddlewares<I, O, T extends O = O>` — an array of middlewares: `Array<IMiddleware<I, O, T>>`
- `TInvalidMiddlewareErreurData` — the data linked to `InvalidMiddlewareErreur`:
  `{ middleware: unknown; infos: string }`
