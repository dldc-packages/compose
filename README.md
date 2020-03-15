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
  Tools,
  Middlewares,
  ContextProvider,
  ContextProviderFn,
  ContextConsumer,
  Done,
  Next,
  Result
} from 'miid';
```

## Example

```ts
import { Middleware, Context } from 'miid';

const ACtx = Context.create<string>('A');

const mid = Middleware.compose<string>(
  tools => {
    console.log('middleware 1');
    console.log((tools as any).debug());
    return tools.withContext(ACtx.Provider('a1')).next();
  },
  tools => {
    console.log('middleware 2');
    console.log((tools as any).debug());
    return tools.withContext(ACtx.Provider('a2')).next();
  },
  tools => {
    console.log('middleware 3');
    console.log(tools.readContext(ACtx.Consumer));
    console.log((tools as any).debug());
    return tools.withContext(ACtx.Provider('a3')).next();
  }
);
const mid2 = Middleware.compose(mid, async tools => {
  console.log('done');
  console.log((tools as any).debug());
  return tools.next();
});
Middleware.run(mid2, () => {
  console.log('done 2');
  return 'nope2';
}).then(res => {
  console.log({ res });
});
```
