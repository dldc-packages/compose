# 🏯 Miid [![Build Status](https://travis-ci.org/etienne-dldc/miid.svg?branch=master)](https://travis-ci.org/etienne-dldc/miid) [![](https://badgen.net/bundlephobia/minzip/miid)](https://bundlephobia.com/result?p=miid) [![codecov](https://codecov.io/gh/etienne-dldc/miid/branch/master/graph/badge.svg)](https://codecov.io/gh/etienne-dldc/miid)

> A middleware and context system

## What is this package for

This package manage the composition of middlewares and the context.
It was created for [Tumau](https://github.com/etienne-dldc/tumau) and extracted as its own package.

## API

```ts
import {
  Middleware,
  Context,
  ContextStack,
  MiidError,
  AsyncResult,
  ContextConsumer,
  ContextProvider,
  ContextProviderFn,
  Middlewares,
  Next,
  Result
} from 'miid';
```

## Example

```ts
import { Middleware, Context } from 'miid';

const ACtx = Context.create<string>('A');

const mid = Middleware.compose<string>(
  (ctx, next) => {
    console.log('middleware 1');
    console.log(ctx.debug());
    return next(ctx.withContext(ACtx.Provider('a1')));
  },
  (ctx, next) => {
    console.log('middleware 2');
    console.log(ctx.debug());
    return next(ctx.withContext(ACtx.Provider('a2')));
  },
  (ctx, next) => {
    console.log('middleware 3');
    console.log(ctx.readContext(ACtx.Consumer));
    console.log(ctx.debug());
    return next(ctx.withContext(ACtx.Provider('a3')));
  }
);
const mid2 = Middleware.compose(mid, async (ctx, next) => {
  console.log('done');
  console.log(ctx.debug());
  return next(ctx);
});
Middleware.run(mid2, () => {
  console.log('done 2');
  return 'nope2';
}).then(res => {
  console.log({ res });
});
```
