# 🏯 Miid [![Build Status](https://travis-ci.org/etienne-dldc/miid.svg?branch=master)](https://travis-ci.org/etienne-dldc/miid) [![](https://badgen.net/bundlephobia/minzip/miid)](https://bundlephobia.com/result?p=miid) [![codecov](https://codecov.io/gh/etienne-dldc/miid/branch/master/graph/badge.svg)](https://codecov.io/gh/etienne-dldc/miid)

> A type-safe middleware system

## Example

```ts
import { compose, createContext } from 'miid';

const ACtx = createContext<string>('A');

const mid = compose<string>(
  (ctx, next) => {
    console.log('middleware 1');
    console.log(ctx.debug());
    return next(ctx.with(ACtx.Provider('a1')));
  },
  (ctx, next) => {
    console.log('middleware 2');
    console.log(ctx.debug());
    return next(ctx.with(ACtx.Provider('a2')));
  },
  (ctx, next) => {
    console.log('middleware 3');
    console.log(ctx.read(ACtx.Consumer));
    console.log(ctx.debug());
    return next(ctx.with(ACtx.Provider('a3')));
  }
);
const mid2 = compose(mid, async (ctx, next) => {
  console.log('done');
  console.log(ctx.debug());
  return next(ctx);
});
runMiddleware(mid2, () => {
  console.log('done 2');
  return 'nope2';
}).then((res) => {
  console.log({ res });
});
```

## Installation

```bash
npm install miid
# or
yarn add midd
```
