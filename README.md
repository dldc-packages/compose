# 🏯 Miid

> A type-safe middleware system

## Example

```ts
import { compose, createKey, Stack } from 'miid';

const ACtx = createKey<string>({ name: 'ACtx', defaultValue: 'A' });

const mid = compose<Stack, string>(
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
  },
);
const mid2 = compose(mid, (ctx, next) => {
  console.log('done');
  console.log(ctx.debug());
  return next(ctx);
});
mid2(new Stack(), () => {
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

## Extending `Stack`

You can create your own `Stack`:

```ts
class CustomStack extends Stack {
  // You need to override the `with` method to return a new instance of your CustomStack
  with(...keys: Array<KeyProvider<any>>): CustomStack {
    // Use the static `applyKeys` method to apply keys to the current instance
    return Stack.applyKeys<CustomStack>(this, keys, (internal) => new CustomStack(internal));
  }
}

const custom = new CustomStack();
expect(custom instanceof CustomStack).toBe(true);
expect(custom instanceof Stack).toBe(true);
```

If you want to pass custom arguments to yout CustomStack you need to override the `withInternal` method:

```ts
class ParamsStack extends Stack {
  // You can pass your own parameters to the constructor
  constructor(
    public readonly param: string,
    internal: StackInternal<ParamsStack> | null = null,
  ) {
    super(internal);
  }

  with(...keys: Array<KeyProvider<any>>): ParamsStack {
    return Stack.applyKeys<ParamsStack>(this, keys, (internal) => new ParamsStack(this.param, internal));
  }
}

const custom = new ParamsStack('some value');
expect(custom.param).toBe('some value');
expect(custom instanceof ParamsStack).toBe(true);
expect(custom instanceof Stack).toBe(true);
```
