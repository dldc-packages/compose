# 🏯 Miid [![Build Status](https://travis-ci.com/etienne-dldc/miid.svg?branch=master)](https://travis-ci.com/etienne-dldc/miid) [![](https://badgen.net/bundlephobia/minzip/miid)](https://bundlephobia.com/result?p=miid) [![codecov](https://codecov.io/gh/etienne-dldc/miid/branch/master/graph/badge.svg)](https://codecov.io/gh/etienne-dldc/miid)

> A type-safe middleware system

## Example

```ts
import { compose, createContext, ContextStack } from 'miid';

const ACtx = createContext<string>({ name: 'ACtx', defaultValue: 'A' });

const mid = compose<ContextStack, string>(
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
    console.log(ctx.get(ACtx.Consumer));
    console.log(ctx.debug());
    return next(ctx.with(ACtx.Provider('a3')));
  }
);
const mid2 = compose(mid, (ctx, next) => {
  console.log('done');
  console.log(ctx.debug());
  return next(ctx);
});
mid2(ContextStack.createEmpty(), () => {
  console.log('done 2');
  return 'nope2';
});
```

## Installation

```bash
npm install miid
# or
yarn add miid
```

## Extending `ContextStack`

You can create your own `ContextStack`:

```ts
export class CustomContext extends ContextStack {
  // You need to override createEmpty otherwise it will create ContextStack
  static createEmpty(): CustomContext {
    return new CustomContext();
  }

  // Make the constructor protected because it should not be accessible from outside
  // It's important to keep the same argument as the original ContextStack, otherwise the `with()` method won't work
  protected constructor(provider?: ContextProvider<any>, parent?: CustomContext) {
    super(provider, parent);
  }
}

const custom = CustomContext.createEmpty();
expect(custom instanceof CustomContext).toBe(true);
expect(custom instanceof ContextStack).toBe(true);
```
